import os
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models import User, Role, Session as UserSession, Wallet, WalletType
from app.config import Config

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is required")
if len(SECRET_KEY) < 32:
    raise ValueError("JWT_SECRET must be at least 32 characters long")
if SECRET_KEY in ["dev-secret-key", "your-jwt-secret-key-here"]:
    raise ValueError("JWT_SECRET cannot use default/example values")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_anonymous_user(db: Session, device_fingerprint_hash: str) -> User:
    # Get anonymous role
    anon_role = db.query(Role).filter(Role.name == "anonymous").first()
    if not anon_role:
        config = Config.get_role_config("anonymous")
        anon_role = Role(
            name="anonymous",
            display_name="Anonymous User",
            daily_communal_limit_tokens=config["daily_communal_limit_tokens"],
            max_request_tokens=config["max_request_tokens"]
        )
        db.add(anon_role)
        db.flush()
    
    # Create anonymous user
    user = User(
        email=None,
        password_hash=None,
        role_id=anon_role.id,
        display_name=f"Anonymous-{str(uuid.uuid4())[:8]}",
        is_verified=False
    )
    db.add(user)
    db.flush()
    
    # Create personal wallet with default balance
    config = Config.get_role_config("anonymous")
    wallet = Wallet(
        user_id=user.id,
        type=WalletType.personal,
        balance_tokens=config["default_balance"]
    )
    db.add(wallet)
    db.commit()
    
    return user

def hash_device_fingerprint(fingerprint_data: str) -> str:
    secret = os.getenv("DEVICE_FINGERPRINT_SECRET", "dev-fingerprint-secret")
    return hmac.new(
        secret.encode(),
        fingerprint_data.encode(),
        hashlib.sha256
    ).hexdigest()

def create_anonymous_session(db: Session) -> dict:
    """Create anonymous user session with JWT token"""
    try:
        # Create anonymous user with basic device fingerprint
        device_fingerprint = "anonymous-session"
        user = create_anonymous_user(db, device_fingerprint)
        
        # Create JWT token
        token_data = {"sub": str(user.id), "email": None, "role": "anonymous"}
        access_token = create_access_token(token_data)
        
        return {
            "session_token": access_token,
            "user_id": str(user.id),
            "role": "anonymous",
            "personal_wallet_balance": 30000  # Default balance
        }
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to create anonymous session: {str(e)}")