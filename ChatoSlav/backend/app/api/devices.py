from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import DeviceFingerprint
from app.services.auth import hash_device_fingerprint

router = APIRouter()

class DeviceRegistration(BaseModel):
    fingerprint_hash: str
    metadata: dict = {}

@router.post("/register")
async def register_device(request: DeviceRegistration, db: Session = Depends(get_db)):
    """Register device fingerprint"""
    try:
        # Hash the fingerprint for security
        hashed_fingerprint = hash_device_fingerprint(request.fingerprint_hash)
        
        # Check if device already exists
        existing_device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.fingerprint_hash == hashed_fingerprint
        ).first()
        
        if existing_device:
            return {"device_id": existing_device.id, "status": "existing"}
        
        # Create new device fingerprint
        device = DeviceFingerprint(
            fingerprint_hash=hashed_fingerprint,
            device_metadata=request.metadata
        )
        db.add(device)
        db.commit()
        
        return {"device_id": device.id, "status": "created"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Device registration failed")

@router.post("/bind")
async def bind_device(device_id: str, user_id: str, db: Session = Depends(get_db)):
    """Bind device to user (MVP stub)"""
    # TODO: Implement device binding with email confirmation
    raise HTTPException(status_code=501, detail="Device binding not implemented in MVP")

@router.get("/{device_id}")
async def get_device(device_id: int, db: Session = Depends(get_db)):
    """Get device information"""
    device = db.query(DeviceFingerprint).filter(DeviceFingerprint.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "id": device.id,
        "first_seen_at": device.first_seen_at,
        "last_seen_at": device.last_seen_at,
        "bound_user_id": str(device.bound_user_id) if device.bound_user_id else None
    }