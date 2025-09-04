from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.services.auth import verify_token
from app.models import World, WorldChat, WorldChatMessage
from app.services.wallet import charge_tokens, create_usage_record
from app.services.wallet_events import create_world_chat_expense_event

router = APIRouter()

class WorldChatRequest(BaseModel):
    message: str
    prefer_communal: bool = False

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload["sub"]

@router.get("/world-chats/{world_id}")
async def get_world_chat(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get or create world chat for user"""
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    # Get existing chat
    world_chat = db.query(WorldChat).filter(
        WorldChat.user_id == current_user,
        WorldChat.world_id == world_id
    ).first()
    
    if not world_chat:
        # Create new chat
        world_chat = WorldChat(
            user_id=current_user,
            world_id=world_id,
            openai_thread_id=f"thread_{current_user}_{world_id}",
            title=f"{world.name} Chat"
        )
        db.add(world_chat)
        db.commit()
        db.refresh(world_chat)
    
    messages = [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat()
        }
        for msg in world_chat.messages
    ]
    
    return {
        "id": str(world_chat.id),
        "title": world_chat.title,
        "messages": messages
    }

@router.post("/world-chats/{world_id}/message")
async def send_world_chat_message(
    world_id: int,
    request: WorldChatRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Send message to world chat"""
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    # Get or create chat
    world_chat = db.query(WorldChat).filter(
        WorldChat.user_id == current_user,
        WorldChat.world_id == world_id
    ).first()
    
    if not world_chat:
        world_chat = WorldChat(
            user_id=current_user,
            world_id=world_id,
            openai_thread_id=f"thread_{current_user}_{world_id}",
            title=f"{world.name} Chat"
        )
        db.add(world_chat)
        db.flush()
    
    try:
        # Save user message
        user_message = WorldChatMessage(
            world_chat_id=world_chat.id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        
        # Generate response
        response_text = f"Mock response from {world.name}: I received your message and I'm processing it."
        
        # Save assistant message
        assistant_message = WorldChatMessage(
            world_chat_id=world_chat.id,
            role="assistant",
            content=response_text
        )
        db.add(assistant_message)
        
        # Update title if first message
        if len(world_chat.messages) == 0:
            world_chat.title = request.message[:50] + ("..." if len(request.message) > 50 else "")
        
        # Charge tokens
        estimated_tokens = 50
        charge_result = charge_tokens(
            db, 
            current_user, 
            estimated_tokens,
            request.prefer_communal
        )
        
        # Create usage record
        create_usage_record(
            db,
            current_user,
            {"total_tokens": estimated_tokens, "prompt_tokens": 25, "completion_tokens": 25},
            charge_result["transaction_id"]
        )
        
        # Create wallet event
        create_world_chat_expense_event(
            db,
            current_user,
            estimated_tokens,
            world_id,
            world.name,
            request.prefer_communal
        )
        
        db.commit()
        print(f"World chat message sent successfully, tokens charged: {estimated_tokens}")
        
        return {
            "message": {
                "role": "assistant",
                "content": response_text
            },
            "usage": {"total_tokens": estimated_tokens},
            "wallet_updated": True
        }
        
    except Exception as e:
        db.rollback()
        if "Insufficient funds" in str(e):
            raise HTTPException(status_code=402, detail="insufficient_funds")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/world-chats/{world_id}")
async def delete_world_chat(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete world chat"""
    world_chat = db.query(WorldChat).filter(
        WorldChat.user_id == current_user,
        WorldChat.world_id == world_id
    ).first()
    
    if world_chat:
        db.delete(world_chat)
        db.commit()
    
    return {"message": "World chat deleted"}