import os
import hashlib
import hmac
from datetime import datetime, timedelta

class LicenseValidator:
    """
    Software license validation system.
    Ensures proper usage rights and prevents unauthorized deployment.
    """
    
    DEVELOPER_SIGNATURE = "SkrepaGPT-v1.0-Developer-Build"
    LICENSE_KEY = os.getenv("SOFTWARE_LICENSE_KEY", "")
    
    @classmethod
    def generate_license_hash(cls) -> str:
        """Generate expected license hash"""
        if not cls.LICENSE_KEY:
            return ""
        
        # Combine signature with license key
        combined = f"{cls.DEVELOPER_SIGNATURE}:{cls.LICENSE_KEY}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    @classmethod
    def validate_deployment(cls) -> dict:
        """Validate deployment license (runs on startup)"""
        if not cls.LICENSE_KEY:
            return {
                "status": "development",
                "message": "Running in development mode",
                "valid": True
            }
        
        expected_hash = cls.generate_license_hash()
        
        # Implement proper HMAC-based license validation
        if not cls._validate_license_signature():
            return {
                "status": "invalid",
                "message": "Invalid license signature",
                "valid": False
            }
            
        return {
            "status": "licensed",
            "message": "Valid software license",
            "valid": True,
            "hash": expected_hash[:16] + "..."  # Partial hash for verification
        }
        
        return {
            "status": "invalid",
            "message": "Invalid or missing license",
            "valid": False
        }
    
    @classmethod
    def get_license_info(cls) -> dict:
        """Get license information"""
        validation = cls.validate_deployment()
        
        return {
            "software": "OrthodoxGPT",
            "version": "1.0.0",
            "developer": "Custom Build",
            "license_status": validation["status"],
            "deployment_date": datetime.now(datetime.timezone.utc).isoformat(),
            "signature": cls.DEVELOPER_SIGNATURE
        }
    
    @classmethod
    def _validate_license_signature(cls) -> bool:
        """Validate license key using HMAC signature"""
        if not cls.LICENSE_KEY or len(cls.LICENSE_KEY) < 32:
            return False
        
        try:
            # Extract signature and data from license key
            if ':' not in cls.LICENSE_KEY:
                return False
            
            data_part, signature = cls.LICENSE_KEY.rsplit(':', 1)
            
            # Verify HMAC signature
            secret = os.getenv('LICENSE_VALIDATION_SECRET', 'default-secret')
            expected_signature = hmac.new(
                secret.encode(),
                data_part.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception:
            return False