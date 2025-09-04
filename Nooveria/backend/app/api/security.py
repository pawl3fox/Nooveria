from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
from app.database import get_db
from app.services.security import security_manager
from app.api.admin import get_current_admin_user
from app.models import User

router = APIRouter()

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class SecurityEventResponse(BaseModel):
    events: List[Dict]
    total_count: int

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    req: Request = None
):
    """Change user password with security validation"""
    try:
        client_ip = req.client.host if req else "unknown"
        
        # Rate limiting
        allowed, wait_time = security_manager.check_rate_limit(
            f"{current_user.id}:{client_ip}", "password_change"
        )
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Too many password change attempts. Try again in {wait_time} seconds"
            )
        
        # Verify current password
        if not security_manager.verify_password(request.current_password, current_user.password_hash):
            security_manager.log_security_event(
                "password_change_failed_verification",
                str(current_user.id),
                {"ip": client_ip}
            )
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Validate new password strength
        is_strong, message = security_manager.validate_password_strength(request.new_password)
        if not is_strong:
            raise HTTPException(status_code=400, detail=message)
        
        # Update password
        current_user.password_hash = security_manager.hash_password(request.new_password)
        db.commit()
        
        # Log successful password change
        security_manager.log_security_event(
            "password_changed",
            str(current_user.id),
            {"ip": client_ip}
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        security_manager.log_security_event(
            "password_change_error",
            str(current_user.id),
            {"ip": client_ip, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail="Password change failed")

@router.get("/events")
async def get_security_events(
    current_user: User = Depends(get_current_admin_user),
    limit: int = 100
) -> SecurityEventResponse:
    """Get recent security events (admin only)"""
    try:
        if not security_manager.redis:
            return SecurityEventResponse(events=[], total_count=0)
        
        # Get events from today
        from datetime import datetime
        today = datetime.utcnow().strftime('%Y-%m-%d')
        key = f"security_events:{today}"
        
        events = security_manager.redis.lrange(key, 0, limit - 1)
        total_count = security_manager.redis.llen(key)
        
        # Parse events
        parsed_events = []
        for event_str in events:
            try:
                import ast
                event = ast.literal_eval(event_str)
                parsed_events.append(event)
            except:
                continue
        
        return SecurityEventResponse(
            events=parsed_events,
            total_count=total_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get security events")

@router.post("/unlock-account")
async def unlock_account(
    email: str,
    current_user: User = Depends(get_current_admin_user),
    req: Request = None
):
    """Unlock user account (admin only)"""
    try:
        client_ip = req.client.host if req else "unknown"
        
        # Clear failed login attempts and unlock account
        security_manager.clear_failed_logins(email)
        
        # Log admin action
        security_manager.log_security_event(
            "account_unlocked_by_admin",
            str(current_user.id),
            {"target_email": email, "ip": client_ip}
        )
        
        return {"message": f"Account {email} unlocked successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to unlock account")

@router.get("/account-status/{email}")
async def get_account_status(
    email: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Get account security status (admin only)"""
    try:
        is_locked, unlock_time = security_manager.is_account_locked(email)
        
        status = {
            "email": email,
            "locked": is_locked,
            "unlock_time": unlock_time.isoformat() if unlock_time else None
        }
        
        if security_manager.redis:
            # Get failed login count
            failed_key = f"failed_login:{email}"
            failed_attempts = security_manager.redis.get(failed_key) or 0
            status["failed_attempts"] = int(failed_attempts)
        
        return status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get account status")