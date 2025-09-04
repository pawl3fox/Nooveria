from sqlalchemy.orm import Session
from app.models import WalletEvent
from decimal import Decimal

def create_topup_event(db: Session, user_id: str, amount: float, description: str = None):
    """Create wallet topup event"""
    event = WalletEvent(
        user_id=user_id,
        event_type="topup",
        amount=Decimal(str(amount)),
        description=description or f"Пополнение кошелька на {amount} токенов"
    )
    db.add(event)

def create_chat_expense_event(db: Session, user_id: str, amount: float, chat_id: str = None, is_communal: bool = False):
    print(f"Creating chat expense event: user={user_id}, amount={amount}, chat_id={chat_id}, communal={is_communal}")
    """Create separate events for personal and communal expenses"""
    event_type = "chat_expense_communal" if is_communal else "chat_expense_personal"
    description = f"Расходы на чат (общие токены): {amount} токенов" if is_communal else f"Расходы на чат (личные токены): {amount} токенов"
    
    # Always create new event for each expense
    event = WalletEvent(
        user_id=user_id,
        event_type=event_type,
        amount=Decimal(str(amount)),
        description=description,
        chat_id=chat_id
    )
    db.add(event)

def create_world_chat_expense_event(db: Session, user_id: str, amount: float, world_id: int, world_name: str, is_communal: bool = False):
    print(f"Creating world chat expense event: user={user_id}, amount={amount}, world_id={world_id}, world_name={world_name}, communal={is_communal}")
    """Create separate events for personal and communal world chat expenses"""
    event_type = "world_chat_expense_communal" if is_communal else "world_chat_expense_personal"
    description = f"Расходы в мире '{world_name}' (общие токены): {amount} токенов" if is_communal else f"Расходы в мире '{world_name}' (личные токены): {amount} токенов"
    
    # Always create new event for each expense
    event = WalletEvent(
        user_id=user_id,
        event_type=event_type,
        amount=Decimal(str(amount)),
        description=description,
        world_id=world_id
    )
    db.add(event)

def create_transfer_event(db: Session, from_user_id: str, to_user_id: str, amount: float):
    """Create transfer events for both users"""
    # Sender event
    sender_event = WalletEvent(
        user_id=from_user_id,
        event_type="transfer_sent",
        amount=Decimal(str(-amount)),  # Negative for sender
        description=f"Перевод {amount} токенов"
    )
    db.add(sender_event)
    
    # Receiver event
    receiver_event = WalletEvent(
        user_id=to_user_id,
        event_type="transfer_received",
        amount=Decimal(str(amount)),  # Positive for receiver
        description=f"Получен перевод {amount} токенов"
    )
    db.add(receiver_event)