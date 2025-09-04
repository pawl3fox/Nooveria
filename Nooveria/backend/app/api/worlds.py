from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models import World, UserWorld, User, WorldChat, WorldChatMessage
from app.services.auth import verify_token
from app.services.world_chat import send_world_message, delete_all_world_chats
import time
from app.services.wallet import charge_tokens, create_usage_record
from app.services.wallet_events import create_world_chat_expense_event

router = APIRouter()

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

class WorldCreate(BaseModel):
    name: str
    description: str
    assistant_id: str
    image_url: str = None

class WorldResponse(BaseModel):
    id: int
    name: str
    description: str
    assistant_id: str
    image_url: str = None
    tokens_spent: int = 0
    is_active: bool

class UserWorldResponse(BaseModel):
    id: int
    world: WorldResponse
    is_pinned: bool

@router.post("/worlds", response_model=WorldResponse)
async def create_world(
    world_data: WorldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role.name != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        world = World(
            name=world_data.name,
            description=world_data.description,
            assistant_id=world_data.assistant_id,
            image_url=world_data.image_url
        )
        db.add(world)
        db.commit()
        db.refresh(world)
        return world
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating world: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/worlds", response_model=List[WorldResponse])
async def get_worlds(db: Session = Depends(get_db)):
    try:
        worlds = db.query(World).filter(World.is_active == True).order_by(World.tokens_spent.desc()).all()
        return worlds
    except Exception as e:
        print(f"Error getting worlds: {e}")
        return []

@router.get("/user-worlds", response_model=List[UserWorldResponse])
async def get_user_worlds(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_worlds = db.query(UserWorld).filter(
        UserWorld.user_id == current_user.id,
        UserWorld.is_pinned == True
    ).all()
    return user_worlds

@router.post("/worlds/{world_id}/pin")
async def pin_world(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(UserWorld).filter(
        UserWorld.user_id == current_user.id,
        UserWorld.world_id == world_id
    ).first()
    
    if existing:
        existing.is_pinned = True
    else:
        user_world = UserWorld(
            user_id=current_user.id,
            world_id=world_id,
            is_pinned=True
        )
        db.add(user_world)
    
    db.commit()
    return {"message": "World pinned"}

@router.delete("/worlds/{world_id}/unpin")
async def unpin_world(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_world = db.query(UserWorld).filter(
        UserWorld.user_id == current_user.id,
        UserWorld.world_id == world_id
    ).first()
    
    if user_world:
        user_world.is_pinned = False
        
        # Delete world chat when unpinning
        world_chat = db.query(WorldChat).filter(
            WorldChat.user_id == current_user.id,
            WorldChat.world_id == world_id
        ).first()
        
        if world_chat:
            from app.services.world_chat import delete_world_chat
            delete_world_chat(db, world_chat)
        
        db.commit()
    
    return {"message": "World unpinned"}

@router.delete("/worlds/{world_id}")
async def delete_world(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role.name != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        world = db.query(World).filter(World.id == world_id).first()
        if not world:
            raise HTTPException(status_code=404, detail="World not found")
        
        # Delete all world chats first
        delete_all_world_chats(db, world_id)
        
        # Delete user_worlds manually
        db.query(UserWorld).filter(UserWorld.world_id == world_id).delete()
        
        # Delete world
        db.delete(world)
        db.commit()
        return {"message": "World deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting world: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class WorldChatMessageRequest(BaseModel):
    message: str
    prefer_communal: bool = False

@router.get("/worlds/{world_id}/chats")
async def get_world_conversations(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for a world"""
    world_chats = db.query(WorldChat).filter(
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).order_by(WorldChat.updated_at.desc()).all()
    
    return [
        {
            "id": str(chat.id),
            "title": chat.title,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "message_count": len(chat.messages)
        }
        for chat in world_chats
    ]

@router.post("/worlds/{world_id}/chats")
async def create_world_conversation(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new world conversation"""
    world = db.query(World).filter(World.id == world_id).first()
    if not world:
        raise HTTPException(status_code=404, detail="World not found")
    
    world_chat = WorldChat(
        user_id=current_user.id,
        world_id=world_id,
        openai_thread_id=f"thread_{current_user.id}_{world_id}_{int(time.time())}",
        title=f"New {world.name} Chat"
    )
    db.add(world_chat)
    db.commit()
    db.refresh(world_chat)
    
    return {
        "id": str(world_chat.id),
        "title": world_chat.title,
        "created_at": world_chat.created_at.isoformat(),
        "updated_at": world_chat.updated_at.isoformat(),
        "message_count": 0
    }

@router.post("/worlds/{world_id}/chats/{chat_id}/messages")
async def send_world_message_to_conversation(
    world_id: int,
    chat_id: str,
    message_data: WorldChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    world_chat = db.query(WorldChat).filter(
        WorldChat.id == chat_id,
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).first()
    
    if not world_chat:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    try:
        response = send_world_message(db, world_chat, message_data.message)
        
        estimated_tokens = len(message_data.message) // 4 + len(response["response"]) // 4
        charge_result = charge_tokens(
            db, 
            str(current_user.id), 
            estimated_tokens,
            message_data.prefer_communal
        )
        
        create_usage_record(
            db,
            str(current_user.id),
            {"total_tokens": estimated_tokens, "prompt_tokens": len(message_data.message) // 4, "completion_tokens": len(response["response"]) // 4},
            charge_result["transaction_id"]
        )
        
        create_world_chat_expense_event(
            db,
            str(current_user.id),
            estimated_tokens,
            world_id,
            response["world_name"]
        )
        
        return response
        
    except Exception as e:
        db.rollback()
        if "Insufficient funds" in str(e):
            raise HTTPException(status_code=402, detail="insufficient_funds")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

class WorldChatResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class WorldChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

class WorldChatDetailResponse(BaseModel):
    id: str
    title: str
    messages: List[WorldChatMessageResponse]

@router.get("/worlds/{world_id}/chats", response_model=List[WorldChatResponse])
async def get_world_chats(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all chats for current user in specific world"""
    world_chats = db.query(WorldChat).filter(
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).order_by(WorldChat.updated_at.desc()).all()
    
    return [
        WorldChatResponse(
            id=str(chat.id),
            title=chat.title,
            created_at=chat.created_at.isoformat(),
            updated_at=chat.updated_at.isoformat(),
            message_count=len(chat.messages)
        )
        for chat in world_chats
    ]

@router.get("/worlds/{world_id}/chats/{chat_id}", response_model=WorldChatDetailResponse)
async def get_world_chat(
    world_id: int,
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific world chat with messages"""
    world_chat = db.query(WorldChat).filter(
        WorldChat.id == chat_id,
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).first()
    
    if not world_chat:
        raise HTTPException(status_code=404, detail="World chat not found")
    
    messages = [
        WorldChatMessageResponse(
            id=str(msg.id),
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at.isoformat()
        )
        for msg in world_chat.messages
    ]
    
    return WorldChatDetailResponse(
        id=str(world_chat.id),
        title=world_chat.title,
        messages=messages
    )

@router.delete("/worlds/{world_id}/chat")
async def delete_user_world_chat(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete user's world chat (when unpinning from sidebar)"""
    world_chat = db.query(WorldChat).filter(
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).first()
    
    if world_chat:
        from app.services.world_chat import delete_world_chat
        delete_world_chat(db, world_chat)
        db.commit()
    
    return {"message": "World chat deleted"}

@router.delete("/worlds/{world_id}/chats/{chat_id}")
async def delete_world_chat_endpoint(
    world_id: int,
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete specific world chat"""
    world_chat = db.query(WorldChat).filter(
        WorldChat.id == chat_id,
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).first()
    
    if not world_chat:
        raise HTTPException(status_code=404, detail="World chat not found")
    
    from app.services.world_chat import delete_world_chat
    delete_world_chat(db, world_chat)
    db.commit()
    
    return {"message": "World chat deleted"}

@router.delete("/worlds/{world_id}/chats")
async def delete_all_user_world_chats(
    world_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all chats for current user in specific world"""
    world_chats = db.query(WorldChat).filter(
        WorldChat.user_id == current_user.id,
        WorldChat.world_id == world_id
    ).all()
    
    from app.services.world_chat import delete_world_chat
    for world_chat in world_chats:
        delete_world_chat(db, world_chat)
    
    db.commit()
    return {"message": f"Deleted {len(world_chats)} world chats"}