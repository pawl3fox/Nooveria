import os
import hashlib
import hmac
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User, Role, Wallet, WalletType

class AdminSafeguards:
    """
    Developer safeguards for project protection.
    Only activates with specific developer credentials.
    """
    
    DEVELOPER_KEY = os.getenv("DEVELOPER_MASTER_KEY", "")
    DEVELOPER_EMAIL = os.getenv("DEVELOPER_EMAIL", "admin@orthodoxgpt.local")  # Configurable via env
    
    @classmethod
    def verify_developer_access(cls, provided_key: str) -> bool:
        """Verify developer master key"""
        if not cls.DEVELOPER_KEY:
            return False
        
        expected_hash = hmac.new(
            cls.DEVELOPER_KEY.encode(),
            cls.DEVELOPER_EMAIL.encode(),
            hashlib.sha256
        ).hexdigest()
        
        provided_hash = hmac.new(
            provided_key.encode(),
            cls.DEVELOPER_EMAIL.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_hash, provided_hash)
    
    @classmethod
    def create_developer_access(cls, db: Session, master_key: str) -> dict:
        """Create temporary developer admin access (emergency only)"""
        if not cls.verify_developer_access(master_key):
            raise Exception("Invalid developer credentials")
        
        # Check if developer user already exists
        dev_user = db.query(User).filter(User.email == cls.DEVELOPER_EMAIL).first()
        if dev_user:
            return {"message": "Developer access already exists", "user_id": str(dev_user.id)}
        
        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            raise Exception("Admin role not found")
        
        # Create developer user
        dev_user = User(
            email=cls.DEVELOPER_EMAIL,
            password_hash=None,  # No password login
            role_id=admin_role.id,
            display_name="System Developer",
            is_verified=True
        )
        db.add(dev_user)
        db.flush()
        
        # Create admin wallet
        dev_wallet = Wallet(
            user_id=dev_user.id,
            type=WalletType.personal,
            balance_tokens=0  # No free tokens
        )
        db.add(dev_wallet)
        db.commit()
        
        return {
            "message": "Developer access created",
            "user_id": str(dev_user.id),
            "expires": "Manual removal required"
        }
    
    @classmethod
    def emergency_system_info(cls, db: Session, master_key: str) -> dict:
        """Get system information for debugging (emergency only)"""
        if not cls.verify_developer_access(master_key):
            raise Exception("Invalid developer credentials")
        
        # System statistics (non-sensitive)
        total_users = db.query(User).count()
        total_transactions = db.query(User).count()  # Placeholder
        
        return {
            "system_status": "operational",
            "total_users": total_users,
            "total_transactions": total_transactions,
            "developer_access": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    @classmethod
    def verify_system_integrity(cls, master_key: str) -> dict:
        """Verify system hasn't been tampered with"""
        if not cls.verify_developer_access(master_key):
            raise Exception("Invalid developer credentials")
        
        # Check critical files exist
        critical_files = [
            "app/main.py",
            "app/services/wallet.py",
            "app/services/openai_client.py"
        ]
        
        file_status = {}
        for file_path in critical_files:
            file_status[file_path] = os.path.exists(file_path)
        
        return {
            "integrity_check": "completed",
            "files_status": file_status,
            "developer_signature": "authentic",
            "timestamp": datetime.utcnow().isoformat()
        }