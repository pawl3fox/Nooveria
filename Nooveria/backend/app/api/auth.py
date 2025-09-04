from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import User, Role, Wallet, WalletType, DeviceFingerprint
from app.services.auth import (
    verify_password, get_password_hash, create_access_token,
    create_anonymous_user, hash_device_fingerprint, verify_token
)
from app.services.security import security_manager
from datetime import datetime
from app.services.device_tracking import device_tracker
from app.config import Config
from app.services.validation import PasswordValidator, EmailValidator
from app.middleware.rate_limit import check_auth_rate_limit

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    display_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AnonymousRequest(BaseModel):
    device_fingerprint: str = ""

class LogoutRequest(BaseModel):
    device_fingerprint: str = ""

@router.post("/anon")
async def create_anonymous_session(request: AnonymousRequest, req: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(req, "anon")
    """Create or retrieve existing anonymous session based on device fingerprint"""
    try:
        # Get device fingerprint data
        fingerprint_data = request.device_fingerprint or "default-anonymous"
        
        # Use hardware-based detection with fallback
        from app.services.device_tracking import device_tracker
        
        try:
            # Try to find existing device across browsers
            existing_device = device_tracker.find_matching_device(db, fingerprint_data)
            
            if existing_device and existing_device.bound_user_id:
                # Return existing user from any browser
                user = db.query(User).filter(User.id == existing_device.bound_user_id).first()
                if user:
                    # If user has email, they're registered - return with proper role
                    role = user.role.name if user.email else "anonymous"
                    access_token = create_access_token(data={"sub": str(user.id), "role": role})
                    wallet = db.query(Wallet).filter(
                        Wallet.user_id == user.id,
                        Wallet.type == WalletType.personal
                    ).first()
                    
                    return {
                        "session_token": access_token,
                        "user_id": str(user.id),
                        "role": role,
                        "email": user.email,
                        "display_name": user.display_name,
                        "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                        "returning_user": True
                    }
            
            # Create new user and device record for new hardware
            user = create_anonymous_user(db, "temp-hash")
            device_record = device_tracker.create_device_record(db, fingerprint_data)
            device_record.bound_user_id = user.id
            
        except Exception as e:
            # Fallback to simple hash method
            fingerprint_hash = hash_device_fingerprint(str(fingerprint_data))
            existing_device = db.query(DeviceFingerprint).filter(
                DeviceFingerprint.fingerprint_hash == fingerprint_hash
            ).first()
            
            if existing_device and existing_device.bound_user_id:
                user = db.query(User).filter(User.id == existing_device.bound_user_id).first()
                if user:
                    access_token = create_access_token(data={"sub": str(user.id), "role": "anonymous"})
                    wallet = db.query(Wallet).filter(
                        Wallet.user_id == user.id,
                        Wallet.type == WalletType.personal
                    ).first()
                    
                    return {
                        "session_token": access_token,
                        "user_id": str(user.id),
                        "role": "anonymous",
                        "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                        "returning_user": True
                    }
            
            # Create new user with fallback method
            user = create_anonymous_user(db, fingerprint_hash)
            device_fp = DeviceFingerprint(
                fingerprint_hash=fingerprint_hash,
                bound_user_id=user.id,
                first_seen_at=datetime.utcnow(),
                last_seen_at=datetime.utcnow()
            )
            db.add(device_fp)
        
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id), "role": "anonymous"})
        
        # Get wallet balance
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.type == WalletType.personal
        ).first()
        
        return {
            "session_token": access_token,
            "user_id": str(user.id),
            "role": "anonymous",
            "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
            "returning_user": False
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register")
async def register(request: RegisterRequest, req: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(req, "register")
    """Register new user account and link to existing anonymous session"""
    try:
        # Email validation
        email_valid, email_result = EmailValidator.validate_email(request.email)
        if not email_valid:
            raise HTTPException(status_code=400, detail=email_result)
        request.email = email_result
        
        # Password validation
        password_valid, password_errors = PasswordValidator.validate_password(request.password)
        if not password_valid:
            raise HTTPException(status_code=400, detail=f"Password requirements: {'; '.join(password_errors)}")
        
        # Check if email exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Get current anonymous user from token
        auth_header = req.headers.get("Authorization")
        current_user = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                current_user = db.query(User).filter(User.id == payload["sub"]).first()
        
        if current_user and current_user.email:
            raise HTTPException(status_code=400, detail="Already registered user")
        
        # Get user role
        user_role = db.query(Role).filter(Role.name == "user").first()
        if not user_role:
            config = Config.get_role_config("user")
            user_role = Role(
                name="user",
                display_name="User",
                daily_communal_limit_tokens=config["daily_communal_limit_tokens"],
                max_request_tokens=config["max_request_tokens"]
            )
            db.add(user_role)
            db.flush()
        
        if current_user:
            # Upgrade existing anonymous user
            current_user.email = request.email
            current_user.password_hash = get_password_hash(request.password)
            current_user.role_id = user_role.id
            current_user.display_name = request.display_name
            current_user.is_verified = False
            user = current_user
        else:
            # Create new user
            user = User(
                email=request.email,
                password_hash=get_password_hash(request.password),
                role_id=user_role.id,
                display_name=request.display_name,
                is_verified=False
            )
            db.add(user)
            db.flush()
            
            # Create personal wallet for new user
            config = Config.get_role_config("user")
            wallet = Wallet(
                user_id=user.id,
                type=WalletType.personal,
                balance_tokens=config["default_balance"]
            )
            db.add(wallet)
        
        db.commit()
        
        # Create access token for registered user
        access_token = create_access_token(data={"sub": str(user.id), "role": "user"})
        
        # Get wallet balance
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.type == WalletType.personal
        ).first()
        
        return {
            "session_token": access_token,
            "user_id": str(user.id),
            "role": user.role.name,
            "email": user.email,
            "display_name": user.display_name,
            "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/login")
async def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    check_auth_rate_limit(req, "login")
    """Login with security checks"""
    try:
        # Email validation
        email_valid, email_result = EmailValidator.validate_email(request.email)
        if not email_valid:
            raise HTTPException(status_code=400, detail=email_result)
        request.email = email_result
        
        # Find user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            print(f"User not found: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password (no empty password bypass for security)
        if not user.password_hash or not verify_password(request.password, user.password_hash):
            print(f"Password verification failed for user: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Link current device to this registered user
        auth_header = req.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                # Find device linked to anonymous user and relink to registered user
                device = db.query(DeviceFingerprint).filter(
                    DeviceFingerprint.bound_user_id == payload["sub"]
                ).first()
                if device:
                    device.bound_user_id = user.id
                    db.commit()
        
        print(f"Login successful for user: {request.email}, role: {user.role.name}")
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id), "role": user.role.name})
        
        # Get wallet balance
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.type == WalletType.personal
        ).first()
        
        return {
            "session_token": access_token,
            "user_id": str(user.id),
            "role": user.role.name,
            "email": user.email,
            "display_name": user.display_name,
            "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed")

@router.post("/logout")
async def logout(request: LogoutRequest, req: Request, db: Session = Depends(get_db)):
    """Logout and return to anonymous session for same device"""
    try:
        # Get current user from token
        auth_header = req.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="No active session")
        
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        current_user = db.query(User).filter(User.id == payload["sub"]).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Find device linked to this user
        device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.bound_user_id == current_user.id
        ).first()
        
        if device:
            # Find existing anonymous user for this device
            anonymous_users = db.query(User).join(DeviceFingerprint).filter(
                DeviceFingerprint.fingerprint_hash == device.fingerprint_hash,
                User.email.is_(None)
            ).all()
            
            anonymous_user = None
            for user in anonymous_users:
                if user.id != current_user.id:
                    anonymous_user = user
                    break
            
            if not anonymous_user:
                # Create new anonymous user for this device
                anonymous_user = create_anonymous_user(db, device.fingerprint_hash)
            
            # Link device to anonymous user
            device.bound_user_id = anonymous_user.id
            db.commit()
            
            # Create token for anonymous user
            access_token = create_access_token(data={"sub": str(anonymous_user.id), "role": "anonymous"})
            
            # Get wallet balance
            wallet = db.query(Wallet).filter(
                Wallet.user_id == anonymous_user.id,
                Wallet.type == WalletType.personal
            ).first()
            
            return {
                "session_token": access_token,
                "user_id": str(anonymous_user.id),
                "role": "anonymous",
                "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                "message": "Logged out, returned to anonymous session"
            }
        else:
            # No device found, create fresh anonymous session
            anonymous_user = create_anonymous_user(db, "logout-fallback")
            db.commit()
            
            access_token = create_access_token(data={"sub": str(anonymous_user.id), "role": "anonymous"})
            
            wallet = db.query(Wallet).filter(
                Wallet.user_id == anonymous_user.id,
                Wallet.type == WalletType.personal
            ).first()
            
            return {
                "session_token": access_token,
                "user_id": str(anonymous_user.id),
                "role": "anonymous",
                "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                "message": "Logged out, created new anonymous session"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Logout failed")