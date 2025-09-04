from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import Wallet, Transaction, UsageRecord, WalletType, TransactionType, User
from app.services.cache import CacheService

def get_user_wallets(db: Session, user_id: str) -> dict:
    # Try cache first
    cached = CacheService.get_user_wallet_cache(user_id)
    if cached:
        return cached
    
    # Query database
    personal_wallet = db.query(Wallet).filter(
        and_(Wallet.user_id == user_id, Wallet.type == WalletType.personal)
    ).first()
    
    communal_wallet = db.query(Wallet).filter(Wallet.type == WalletType.communal).first()
    
    result = {
        "personal": {"balance": float(personal_wallet.balance_tokens) if personal_wallet else 0},
        "communal": {"balance": float(communal_wallet.balance_tokens) if communal_wallet else 0}
    }
    
    # Cache result
    CacheService.set_user_wallet_cache(user_id, result)
    return result

def charge_tokens(db: Session, user_id: str, total_tokens: int, prefer_communal: bool = False) -> dict:
    """
    Atomic token charging with personal-first, then communal fallback.
    Returns transaction details or raises exception.
    """
    # Validate user_id format to prevent injection
    try:
        from uuid import UUID
        UUID(user_id)  # Validates UUID format
    except ValueError:
        raise Exception("Invalid user ID format")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise Exception("User not found")
    
    # Get wallets with row locks
    personal_wallet = db.query(Wallet).filter(
        and_(Wallet.user_id == user_id, Wallet.type == WalletType.personal)
    ).with_for_update().first()
    
    communal_wallet = db.query(Wallet).filter(
        Wallet.type == WalletType.communal
    ).with_for_update().first()
    
    if not personal_wallet:
        raise Exception("Personal wallet not found")
    
    tokens_needed = Decimal(str(total_tokens))
    personal_balance = personal_wallet.balance_tokens
    
    # Try personal wallet first
    if personal_balance >= tokens_needed:
        personal_wallet.balance_tokens -= tokens_needed
        
        transaction = Transaction(
            wallet_from_id=personal_wallet.id,
            amount_tokens=tokens_needed,
            type=TransactionType.usage,
            meta={"source": "personal"}
        )
        db.add(transaction)
        db.flush()
        
        # Invalidate cache after transaction
        CacheService.invalidate_user_wallet_cache(user_id)
        
        return {"charged_from": "personal", "amount": float(tokens_needed), "transaction_id": transaction.id}
    
    # Use communal if preferred and available
    elif prefer_communal and communal_wallet:
        # Check daily communal limit with Redis counter
        daily_used = CacheService.get_daily_usage(user_id)
        if daily_used + total_tokens <= user.role.daily_communal_limit_tokens:
            if communal_wallet.balance_tokens >= tokens_needed:
                communal_wallet.balance_tokens -= tokens_needed
                
                transaction = Transaction(
                    wallet_from_id=communal_wallet.id,
                    amount_tokens=tokens_needed,
                    type=TransactionType.communal_withdraw,
                    meta={"source": "communal", "user_id": str(user_id)}
                )
                db.add(transaction)
                db.flush()
                
                # Update daily usage counter
                CacheService.increment_daily_usage(user_id, total_tokens)
                # Invalidate cache
                CacheService.invalidate_user_wallet_cache(user_id)
                
                return {"charged_from": "communal", "amount": float(tokens_needed), "transaction_id": transaction.id}
    
    raise Exception("Insufficient funds")

def create_usage_record(db: Session, user_id: str, usage_data: dict, transaction_id: int):
    """Create usage record with only metadata - NO CHAT CONTENT"""
    usage_record = UsageRecord(
        user_id=user_id,
        prompt_tokens=usage_data["prompt_tokens"],
        completion_tokens=usage_data["completion_tokens"],
        total_tokens=usage_data["total_tokens"],
        openai_response_meta={
            "model": usage_data.get("model"),
            "openai_id": usage_data.get("id")
        },
        transaction_id=transaction_id
    )
    db.add(usage_record)
    db.commit()