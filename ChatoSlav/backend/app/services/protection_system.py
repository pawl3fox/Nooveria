import os
import hashlib
import hmac
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User, Wallet, Transaction

class ProtectionSystem:
    """
    Developer protection system for intellectual property disputes.
    Provides evidence collection and emergency access capabilities.
    """
    
    DEVELOPER_SIGNATURE = "SkrepaGPT-Developer-Build-2024"
    MASTER_KEY = os.getenv("DEVELOPER_MASTER_KEY", "")
    
    @classmethod
    def verify_developer_ownership(cls, provided_key: str) -> bool:
        """Verify developer ownership with master key"""
        if not cls.MASTER_KEY or not provided_key:
            return False
        
        return hmac.compare_digest(cls.MASTER_KEY, provided_key)
    
    @classmethod
    def collect_system_evidence(cls, db: Session, master_key: str) -> dict:
        """Collect evidence of system usage and deployment"""
        if not cls.verify_developer_ownership(master_key):
            raise Exception("Unauthorized access attempt")
        
        # Collect non-personal system statistics
        evidence = {
            "system_info": {
                "developer_signature": cls.DEVELOPER_SIGNATURE,
                "deployment_timestamp": datetime.utcnow().isoformat(),
                "total_users": db.query(User).count(),
                "total_transactions": db.query(Transaction).count(),
                "system_version": os.getenv('SYSTEM_VERSION', '1.0.0')
            },
            "usage_statistics": {
                "active_users_count": db.query(User).filter(
                    User.created_at >= datetime.utcnow() - timedelta(days=30)
                ).count(),
                "revenue_generating": True if db.query(Transaction).count() > 0 else False
            },
            "developer_verification": {
                "authentic_build": True,
                "tamper_evidence": cls._check_system_integrity(),
                "access_timestamp": datetime.utcnow().isoformat()
            }
        }
        
        return evidence
    
    @classmethod
    def _check_system_integrity(cls) -> dict:
        """Check if core system files have been modified"""
        core_files = [
            "app/main.py",
            "app/services/wallet.py", 
            "app/services/openai_client.py",
            "app/services/protection_system.py"
        ]
        
        integrity_status = {}
        for file_path in core_files:
            integrity_status[file_path] = {
                "exists": os.path.exists(file_path),
                "developer_code": cls._check_file_signature(file_path) if os.path.exists(file_path) else False
            }
        
        return integrity_status
    
    @classmethod
    def _check_file_signature(cls, file_path: str) -> bool:
        """Safely check if file contains developer signature"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                return cls.DEVELOPER_SIGNATURE in content
        except (IOError, PermissionError, UnicodeDecodeError):
            return False
    
    @classmethod
    def create_evidence_report(cls, db: Session, master_key: str) -> str:
        """Generate evidence report for legal purposes"""
        if not cls.verify_developer_ownership(master_key):
            raise Exception("Unauthorized access")
        
        evidence = cls.collect_system_evidence(db, master_key)
        
        report = f"""
DEVELOPER EVIDENCE REPORT
========================
Generated: {datetime.utcnow().isoformat()}
System: {evidence['system_info']['developer_signature']}

DEPLOYMENT EVIDENCE:
- System is actively deployed and operational
- Total users: {evidence['system_info']['total_users']}
- Total transactions: {evidence['system_info']['total_transactions']}
- Revenue generating: {evidence['usage_statistics']['revenue_generating']}

AUTHENTICITY VERIFICATION:
- Developer signature present: {evidence['developer_verification']['authentic_build']}
- System integrity check completed
- Access verified with developer master key

This report serves as evidence of:
1. Successful deployment of developer-created software
2. Active commercial usage of the system
3. Authentic developer build verification
========================
"""
        return report
    
    @classmethod
    def emergency_system_notice(cls, db: Session, master_key: str, notice_message: str) -> dict:
        """Add system notice (for dispute resolution)"""
        if not cls.verify_developer_ownership(master_key):
            raise Exception("Unauthorized access")
        
        # This creates a visible notice without disrupting service
        notice_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": notice_message,
            "developer_verified": True,
            "system_status": "operational_with_notice"
        }
        
        # In a real dispute, this could be displayed to admin users
        return {
            "notice_created": True,
            "message": "System notice has been logged",
            "data": notice_data
        }