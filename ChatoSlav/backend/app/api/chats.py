from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.services.auth import verify_token
from app.models.chat import Chat, ChatMessage

router = APIRouter()

class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

class ChatDetailResponse(BaseModel):
    id: str
    title: str
    messages: List[MessageResponse]

class SendMessageRequest(BaseModel):
    message: str
    prefer_communal: bool = False

class RenameChatRequest(BaseModel):
    title: str

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload["sub"]

@router.get("", response_model=List[ChatResponse])
async def get_chats(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get all chats for current user"""
    try:
        print(f"Getting chats for user: {current_user}")
        chats = db.query(Chat).filter(Chat.user_id == current_user).order_by(Chat.updated_at.desc()).all()
        print(f"Found {len(chats)} chats")
        
        return [
            ChatResponse(
                id=str(chat.id),
                title=chat.title,
                created_at=chat.created_at.isoformat(),
                updated_at=chat.updated_at.isoformat(),
                message_count=len(chat.messages)
            )
            for chat in chats
        ]
    except Exception as e:
        print(f"Error getting chats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ChatResponse)
async def create_chat(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create new chat"""
    try:
        print(f"Creating chat for user: {current_user}")
        chat = Chat(user_id=current_user, title="New Chat")
        db.add(chat)
        db.commit()
        db.refresh(chat)
        print(f"Created chat with ID: {chat.id}")
        
        return ChatResponse(
            id=str(chat.id),
            title=chat.title,
            created_at=chat.created_at.isoformat(),
            updated_at=chat.updated_at.isoformat(),
            message_count=0
        )
    except Exception as e:
        print(f"Error creating chat: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}", response_model=ChatDetailResponse)
async def get_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get chat with messages"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = [
        MessageResponse(
            id=str(msg.id),
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at.isoformat()
        )
        for msg in chat.messages
    ]
    
    return ChatDetailResponse(
        id=str(chat.id),
        title=chat.title,
        messages=messages
    )

@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: str,
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Send message to chat"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    try:
        # Save user message
        user_message = ChatMessage(
            chat_id=chat_id,
            role="user",
            content=request.message
        )
        db.add(user_message)
        
        # Get chat context
        chat_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in chat.messages
        ] + [{"role": "user", "content": request.message}]
        
        # Call OpenAI API with chat context
        from app.services.openai_client import chat_completion
        response = await chat_completion(chat_messages)
        
        # Charge tokens first (before saving assistant message)
        from app.services.wallet import charge_tokens, create_usage_record
        charge_result = charge_tokens(
            db, 
            current_user, 
            response["usage"]["total_tokens"],
            request.prefer_communal
        )
        
        # Create usage record (NO CHAT CONTENT)
        create_usage_record(
            db,
            current_user,
            response["usage"],
            charge_result["transaction_id"]
        )
        
        # Save assistant message
        assistant_message = ChatMessage(
            chat_id=chat_id,
            role="assistant",
            content=response["message"]["content"]
        )
        db.add(assistant_message)
        
        # Update chat title if first message
        if len(chat.messages) == 0:
            chat.title = request.message[:50] + ("..." if len(request.message) > 50 else "")
        
        db.commit()
        
        return {
            "message": response["message"],
            "usage": response["usage"]
        }
        
    except Exception as e:
        db.rollback()
        if "Insufficient funds" in str(e):
            raise HTTPException(status_code=402, detail="insufficient_funds")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{chat_id}/rename")
async def rename_chat(
    chat_id: str,
    request: RenameChatRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Rename chat"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat.title = request.title
    db.commit()
    
    return {"success": True, "title": chat.title}

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete chat"""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    
    return {"success": True}