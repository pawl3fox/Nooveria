import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Role, Wallet, WalletType
from app.services.wallet import charge_tokens, get_user_wallets

# Test database setup - use in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def test_user(db_session):
    # Create role
    role = Role(
        name="user",
        display_name="Test User",
        daily_communal_limit_tokens=10000,
        max_request_tokens=4000
    )
    db_session.add(role)
    db_session.flush()
    
    # Create user
    user = User(
        email="test@example.com",
        role_id=role.id,
        display_name="Test User"
    )
    db_session.add(user)
    db_session.flush()
    
    # Create personal wallet
    wallet = Wallet(
        user_id=user.id,
        type=WalletType.personal,
        balance_tokens=Decimal("1000")
    )
    db_session.add(wallet)
    
    # Create communal wallet
    communal_wallet = Wallet(
        user_id=None,
        type=WalletType.communal,
        balance_tokens=Decimal("10000")
    )
    db_session.add(communal_wallet)
    
    db_session.commit()
    return user

def test_charge_personal_wallet_sufficient_funds(db_session, test_user):
    """Test charging from personal wallet when sufficient funds available"""
    result = charge_tokens(db_session, str(test_user.id), 500, prefer_communal=False)
    
    assert result["charged_from"] == "personal"
    assert result["amount"] == 500.0
    
    # Verify wallet balance updated
    wallets = get_user_wallets(db_session, str(test_user.id))
    assert wallets["personal"]["balance"] == 500.0

def test_charge_communal_wallet_when_personal_insufficient(db_session, test_user):
    """Test charging from communal wallet when personal insufficient"""
    result = charge_tokens(db_session, str(test_user.id), 1500, prefer_communal=True)
    
    assert result["charged_from"] == "communal"
    assert result["amount"] == 1500.0
    
    # Verify communal wallet balance updated
    wallets = get_user_wallets(db_session, str(test_user.id))
    assert wallets["communal"]["balance"] == 8500.0

def test_insufficient_funds_error(db_session, test_user):
    """Test error when insufficient funds in both wallets"""
    with pytest.raises(Exception, match="Insufficient funds"):
        charge_tokens(db_session, str(test_user.id), 2000, prefer_communal=False)

def test_atomic_transaction_rollback(db_session, test_user):
    """Test that failed transactions don't affect wallet balances"""
    initial_balance = get_user_wallets(db_session, str(test_user.id))["personal"]["balance"]
    
    try:
        # This should fail due to insufficient funds
        charge_tokens(db_session, str(test_user.id), 2000, prefer_communal=False)
    except Exception:
        pass
    
    # Balance should remain unchanged
    final_balance = get_user_wallets(db_session, str(test_user.id))["personal"]["balance"]
    assert initial_balance == final_balance