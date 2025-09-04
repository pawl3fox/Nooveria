from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.database import get_db
from app.services.auth import verify_token
from app.services.openai_client import chat_completion
from app.services.wallet import charge_tokens, create_usage_record

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    prefer_communal: bool = False

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Extract user from JWT token"""
    print(f"Auth header received: {authorization}")
    if not authorization or not authorization.startswith("Bearer "):
        print("Missing or malformed authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    # Token extracted for verification
    payload = verify_token(token)
    if not payload:
        print("Token verification failed")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    print(f"User ID from token: {payload['sub']}")
    return payload["sub"]

@router.post("/chat")
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Process chat request through OpenAI proxy.
    CRITICAL: Does not store any chat content, only usage metadata.
    """
    try:
        # Convert messages to OpenAI format
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Call OpenAI API
        response = await chat_completion(openai_messages)
        
        # Begin atomic transaction for token charging
        db.begin()
        try:
            # Charge tokens
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
            
            # Create wallet event for chat expense
            create_chat_expense_event(
                db,
                current_user,
                response["usage"]["total_tokens"],
                None,
                useSharedTokens
            )
            
            # Return only the assistant's response and usage metadata
            return {
                "message": response["message"],
                "usage": response["usage"]
            }
            
        except Exception as e:
            db.rollback()
            if "Insufficient funds" in str(e):
                raise HTTPException(status_code=402, detail="insufficient_funds")
            raise HTTPException(status_code=500, detail=str(e))
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat processing error: {str(e)}")