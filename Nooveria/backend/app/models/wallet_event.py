import uuid
import enum
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class WalletEventType(enum.Enum):
    topup = "topup"
    chat_expense = "chat_expense"
    world_chat_expense = "world_chat_expense"
    transfer_sent = "transfer_sent"
    transfer_received = "transfer_received"

class WalletEvent(Base):
    __tablename__ = "wallet_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    amount = Column(Numeric(precision=15, scale=2), nullable=False)
    description = Column(Text, nullable=False)
    chat_id = Column(UUID(as_uuid=True), nullable=True)  # For grouping chat expenses
    world_id = Column(Integer, nullable=True)  # For world chat expenses
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")