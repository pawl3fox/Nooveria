from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.services.auth import verify_token
from app.services.wallet import get_user_wallets

router = APIRouter()

class TransferRequest(BaseModel):
    to_user_email_or_id: str
    amount: float

class TopupRequest(BaseModel):
    amount: float
    target: str = "personal"  # personal or communal

def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract user from JWT token"""
    # Remove debug print for production security
    if not authorization or not authorization.startswith("Bearer "):
        # Missing or malformed authorization header
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    # Remove debug print for production security
    payload = verify_token(token)
    if not payload:
        # Token verification failed
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # User authenticated successfully
    return payload["sub"]

@router.get("")
async def get_wallets(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get user's wallet balances and daily communal remaining"""
    try:
        wallets = get_user_wallets(db, current_user)
        
        # TODO: Calculate daily_communal_remaining based on usage records
        wallets["daily_communal_remaining"] = 15000  # Placeholder
        
        return wallets
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transfer")
async def transfer_tokens(
    request: TransferRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Transfer tokens between users (MVP stub)"""
    # TODO: Implement token transfer logic
    raise HTTPException(status_code=501, detail="Transfer functionality not implemented in MVP")

@router.get("/communal")
async def get_communal_wallet(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Get communal wallet balance"""
    try:
        from app.models import Wallet, WalletType
        communal_wallet = db.query(Wallet).filter(Wallet.type == WalletType.communal).first()
        
        return {
            "balance": float(communal_wallet.balance_tokens) if communal_wallet else 0,
            "available": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/topup")
async def topup_wallet(
    request: TopupRequest,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """Topup wallet (MVP stub - manual/admin only)"""
    # TODO: Implement topup logic with payment integration
    raise HTTPException(status_code=501, detail="Topup functionality not implemented in MVP")

@router.get("/events")
async def get_wallet_events(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
    limit: int = 50
):
    """Get wallet events history"""
    from app.models import WalletEvent
    
    events = db.query(WalletEvent).filter(
        WalletEvent.user_id == current_user
    ).order_by(WalletEvent.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": str(event.id),
            "type": event.event_type,
            "amount": float(event.amount),
            "description": event.description,
            "created_at": event.created_at.isoformat()
        }
        for event in events
    ]