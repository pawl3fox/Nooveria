from sqlalchemy.orm import Session
from app.models import WorldChat, WorldChatMessage, World, User
import os
import openai
import time

# Removed - no longer needed

def send_world_message(db: Session, world_chat: WorldChat, message: str) -> dict:
    """Send message to world chat and get response"""
    world = db.query(World).filter(World.id == world_chat.world_id).first()
    
    # Save user message
    user_message = WorldChatMessage(
        world_chat_id=world_chat.id,
        role="user",
        content=message
    )
    db.add(user_message)
    
    # Mock assistant response
    assistant_response = f"Mock response from {world.name}: I received your message '{message[:50]}...' and I'm processing it."
    
    # Save assistant message
    assistant_message = WorldChatMessage(
        world_chat_id=world_chat.id,
        role="assistant",
        content=assistant_response
    )
    db.add(assistant_message)
    
    # Update chat title if first message
    if len(world_chat.messages) == 0:
        world_chat.title = message[:50] + ("..." if len(message) > 50 else "")
    
    db.commit()
    
    return {
        "response": assistant_response,
        "world_name": world.name,
        "usage": {"total_tokens": 50}
    }

def delete_world_chat(db: Session, world_chat: WorldChat):
    """Delete world chat"""
    db.delete(world_chat)

def delete_all_world_chats(db: Session, world_id: int):
    """Delete all chats for a world"""
    world_chats = db.query(WorldChat).filter(WorldChat.world_id == world_id).all()
    
    for world_chat in world_chats:
        db.delete(world_chat)