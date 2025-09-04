import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    daily_communal_limit_tokens = Column(Integer, default=10000)
    max_request_tokens = Column(Integer, default=4000)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(Text, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    display_name = Column(String(100), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    role = relationship("Role", back_populates="users")
    sessions = relationship("Session", back_populates="user")
    wallets = relationship("Wallet", back_populates="user")
    device_fingerprints = relationship("DeviceFingerprint", back_populates="bound_user")
    chats = relationship("Chat", back_populates="user")
    user_worlds = relationship("UserWorld", back_populates="user")
    world_chats = relationship("WorldChat", back_populates="user", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active_at = Column(DateTime(timezone=True), server_default=func.now())
    device_fingerprint_id = Column(Integer, ForeignKey("device_fingerprints.id"), nullable=True)
    
    user = relationship("User", back_populates="sessions")
    device_fingerprint = relationship("DeviceFingerprint")