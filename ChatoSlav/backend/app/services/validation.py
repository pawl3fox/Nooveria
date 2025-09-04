import re
from typing import List, Tuple

class PasswordValidator:
    """Secure password validation"""
    
    @staticmethod
    def validate_password(password: str) -> Tuple[bool, List[str]]:
        """Basic password validation"""
        errors = []
        
        if len(password) < 1:
            errors.append("Password is required")
        
        if len(password) > 128:
            errors.append("Password must be less than 128 characters")
        
        return len(errors) == 0, errors

class EmailValidator:
    """Email validation"""
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """Validate email format"""
        email = email.lower().strip()
        
        if not email:
            return False, "Email is required"
        
        if len(email) > 254:
            return False, "Email is too long"
        
        # Basic email regex
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Invalid email format"
        
        # Block disposable email domains
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'throwaway.email'
        ]
        
        domain = email.split('@')[1]
        if domain in disposable_domains:
            return False, "Disposable email addresses not allowed"
        
        return True, email