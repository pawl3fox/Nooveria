import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Numeric, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class WalletType(enum.Enum):
    personal = "personal"
    communal = "communal"

class TransactionType(enum.Enum):
    topup = "topup"
    usage = "usage"
    transfer = "transfer"
    communal_withdraw = "communal_withdraw"
    admin_adjust = "admin_adjust"

class TransferStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    rejected = "rejected"

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    type = Column(Enum(WalletType), nullable=False)
    balance_tokens = Column(Numeric(precision=15, scale=2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="wallets")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True)
    wallet_from_id = Column(Integer, ForeignKey("wallets.id"), nullable=True)
    wallet_to_id = Column(Integer, ForeignKey("wallets.id"), nullable=True)
    
    # Relationships for easier querying
    wallet_from = relationship("Wallet", foreign_keys=[wallet_from_id])
    wallet_to = relationship("Wallet", foreign_keys=[wallet_to_id])
    amount_tokens = Column(Numeric(precision=15, scale=2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    meta = Column(JSON, nullable=True)

class TokenTransfer(Base):
    __tablename__ = "token_transfers"
    
    id = Column(Integer, primary_key=True)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount_tokens = Column(Numeric(precision=15, scale=2), nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UsageRecord(Base):
    __tablename__ = "usage_records"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    request_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    prompt_tokens = Column(Integer, nullable=False)
    completion_tokens = Column(Integer, nullable=False)
    total_tokens = Column(Integer, nullable=False)
    openai_response_meta = Column(JSON, nullable=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)