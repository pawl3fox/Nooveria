import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class WorldChat(Base):
    __tablename__ = "world_chats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    world_id = Column(Integer, ForeignKey("worlds.id"), nullable=False)
    openai_thread_id = Column(String(255), nullable=False, unique=True)
    title = Column(String(255), default="World Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="world_chats")
    world = relationship("World", back_populates="world_chats")
    messages = relationship("WorldChatMessage", back_populates="world_chat", cascade="all, delete-orphan")

class WorldChatMessage(Base):
    __tablename__ = "world_chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    world_chat_id = Column(UUID(as_uuid=True), ForeignKey("world_chats.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    openai_message_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    world_chat = relationship("WorldChat", back_populates="messages")