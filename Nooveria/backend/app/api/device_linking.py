from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, DeviceFingerprint, Wallet, WalletType
from app.services.auth import verify_token, create_access_token
from app.services.device_tracking import device_tracker

router = APIRouter()

class LinkDeviceRequest(BaseModel):
    device_fingerprint: str
    user_token: str

@router.post("/link-device")
async def link_device_to_user(request: LinkDeviceRequest, db: Session = Depends(get_db)):
    """Link current device to registered user account"""
    try:
        # Verify user token
        token_data = verify_token(request.user_token)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = token_data["sub"]
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find or create device record
        try:
            existing_device = device_tracker.find_matching_device(db, request.device_fingerprint)
            
            if existing_device:
                # Link existing device to registered user
                existing_device.bound_user_id = user.id
            else:
                # Create new device record
                device_record = device_tracker.create_device_record(db, request.device_fingerprint)
                device_record.bound_user_id = user.id
        except Exception:
            # Fallback to simple hash method
            from app.services.auth import hash_device_fingerprint
            from datetime import datetime
            
            fingerprint_hash = hash_device_fingerprint(str(request.device_fingerprint))
            existing_device = db.query(DeviceFingerprint).filter(
                DeviceFingerprint.fingerprint_hash == fingerprint_hash
            ).first()
            
            if existing_device:
                existing_device.bound_user_id = user.id
            else:
                device_fp = DeviceFingerprint(
                    fingerprint_hash=fingerprint_hash,
                    bound_user_id=user.id,
                    first_seen_at=datetime.utcnow(),
                    last_seen_at=datetime.utcnow()
                )
                db.add(device_fp)
        
        db.commit()
        
        return {
            "success": True,
            "message": "Device linked to user account",
            "user_id": str(user.id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to link device")

@router.post("/get-device-account")
async def get_device_account(request: dict, db: Session = Depends(get_db)):
    """Get account associated with device (anon or registered)"""
    try:
        device_fingerprint = request.get("device_fingerprint", "")
        
        # Try to find existing device
        try:
            existing_device = device_tracker.find_matching_device(db, device_fingerprint)
        except Exception:
            # Fallback to simple hash method
            from app.services.auth import hash_device_fingerprint
            fingerprint_hash = hash_device_fingerprint(str(device_fingerprint))
            existing_device = db.query(DeviceFingerprint).filter(
                DeviceFingerprint.fingerprint_hash == fingerprint_hash
            ).first()
        
        if existing_device and existing_device.bound_user_id:
            # Return existing user (anon or registered)
            user = db.query(User).filter(User.id == existing_device.bound_user_id).first()
            if user:
                access_token = create_access_token(data={
                    "sub": str(user.id), 
                    "role": user.role.name if user.role else "anonymous"
                })
                
                wallet = db.query(Wallet).filter(
                    Wallet.user_id == user.id,
                    Wallet.type == WalletType.personal
                ).first()
                
                return {
                    "session_token": access_token,
                    "user_id": str(user.id),
                    "role": user.role.name if user.role else "anonymous",
                    "email": user.email,
                    "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                    "has_registered_account": bool(user.email),
                    "returning_user": True
                }
        
        # No device found - this should not happen in normal flow
        raise HTTPException(status_code=404, detail="Device not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get device account")