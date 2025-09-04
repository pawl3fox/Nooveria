import enum
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class FingerprintSource(enum.Enum):
    browser = "browser"
    native_app = "native_app"
    extension = "extension"

class DeviceFingerprint(Base):
    __tablename__ = "device_fingerprints"
    
    id = Column(Integer, primary_key=True)
    fingerprint_hash = Column(String(255), unique=True, nullable=False, index=True)
    fingerprint_source = Column(Enum(FingerprintSource), default=FingerprintSource.browser)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    device_metadata = Column(JSON, nullable=True)
    bound_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationship
    bound_user = relationship("User", back_populates="device_fingerprints")