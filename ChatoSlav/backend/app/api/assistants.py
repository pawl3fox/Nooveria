from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_db
from app.services.auth import verify_token
from app.models.assistant import Assistant
from app.models.chat import Chat, ChatMessage

router = APIRouter()

class AssistantResponse(BaseModel):
    id: str
    name: str
    description: str
    system_prompt: str
    assistant_id: str
    use_openai_assistant: bool
    is_active: bool

class CreateAssistantRequest(BaseModel):
    name: str
    description: str
    system_prompt: str = ""
    assistant_id: str = ""
    use_openai_assistant: bool = False

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload["sub"]

@router.get("", response_model=List[AssistantResponse])
async def get_assistants(db: Session = Depends(get_db)):
    """Get all active assistants"""
    try:
        assistants = db.query(Assistant).filter(Assistant.is_active == True).all()
        
        return [
            AssistantResponse(
                id=str(assistant.id),
                name=assistant.name,
                description=assistant.description,
                system_prompt=assistant.system_prompt or "",
                assistant_id=assistant.assistant_id or "",
                use_openai_assistant=assistant.use_openai_assistant or False,
                is_active=assistant.is_active
            )
            for assistant in assistants
        ]
    except Exception as e:
        print(f"Error getting assistants: {e}")
        # Return empty list if table doesn't exist yet
        return []

class CreateAssistantChatRequest(BaseModel):
    assistant_id: str

@router.post("/chat")
async def create_assistant_chat(
    request: CreateAssistantChatRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create a new chat with an assistant"""
    assistant = db.query(Assistant).filter(Assistant.id == request.assistant_id, Assistant.is_active == True).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    try:
        # Create new chat with assistant name as title
        chat = Chat(user_id=current_user, title=f"Chat with {assistant.name}")
        db.add(chat)
        db.commit()
        db.refresh(chat)
        
        # Add system message only for system prompt assistants
        if not assistant.use_openai_assistant and assistant.system_prompt:
            system_message = ChatMessage(
                chat_id=chat.id,
                role="system",
                content=assistant.system_prompt
            )
            db.add(system_message)
            db.commit()
        
        return {
            "chat_id": str(chat.id),
            "title": chat.title,
            "assistant_name": assistant.name
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Admin endpoints
@router.post("", response_model=AssistantResponse)
async def create_assistant(
    request: CreateAssistantRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Create new assistant (admin only)"""
    # Check if user is admin
    from app.models.user import User
    user = db.query(User).filter(User.id == current_user).first()
    if not user or user.role.name != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        assistant = Assistant(
            name=request.name,
            description=request.description,
            system_prompt=request.system_prompt if not request.use_openai_assistant else None,
            assistant_id=request.assistant_id if request.use_openai_assistant else None,
            use_openai_assistant=request.use_openai_assistant
        )
        db.add(assistant)
        db.commit()
        db.refresh(assistant)
        
        return AssistantResponse(
            id=str(assistant.id),
            name=assistant.name,
            description=assistant.description,
            system_prompt=assistant.system_prompt or "",
            assistant_id=assistant.assistant_id or "",
            use_openai_assistant=assistant.use_openai_assistant,
            is_active=assistant.is_active
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{assistant_id}")
async def delete_assistant(
    assistant_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Delete assistant (admin only)"""
    # Check if user is admin
    from app.models.user import User
    user = db.query(User).filter(User.id == current_user).first()
    if not user or user.role.name != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    assistant = db.query(Assistant).filter(Assistant.id == assistant_id).first()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    assistant.is_active = False
    db.commit()
    
    return {"success": True}