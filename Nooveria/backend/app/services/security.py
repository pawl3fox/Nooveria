import hashlib
import secrets
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from passlib.context import CryptContext
from passlib.hash import argon2
import redis
import re
from sqlalchemy.orm import Session

# Enterprise-grade password context (used by Google, Microsoft, etc.)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,  # 64MB memory
    argon2__time_cost=3,        # 3 iterations
    argon2__parallelism=1,      # Single thread
    argon2__hash_len=32,        # 32 byte hash
    argon2__salt_len=16         # 16 byte salt
)

class SecurityManager:
    """Enterprise security manager for authentication"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.max_login_attempts = 5
        self.lockout_duration = 900  # 15 minutes
        self.rate_limit_window = 300  # 5 minutes
        self.max_requests_per_window = 10
        
    def hash_password(self, password: str) -> str:
        """Hash password using Argon2id (industry standard)"""
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    
    def validate_password_strength(self, password: str) -> Tuple[bool, str]:
        """Validate password meets security requirements"""
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        
        if len(password) > 128:
            return False, "Password too long (max 128 characters)"
        
        # Check for common patterns
        if re.match(r'^[a-z]+$', password):
            return False, "Password must contain uppercase letters, numbers or symbols"
        
        if re.match(r'^[A-Z]+$', password):
            return False, "Password must contain lowercase letters, numbers or symbols"
        
        if re.match(r'^\d+$', password):
            return False, "Password cannot be only numbers"
        
        # Check for common weak passwords
        weak_passwords = {
            'password', 'password123', '123456789', 'qwerty123',
            'admin123', 'letmein', 'welcome123', 'password1'
        }
        if password.lower() in weak_passwords:
            return False, "Password is too common"
        
        return True, "Password is strong"
    
    def check_rate_limit(self, identifier: str, action: str) -> Tuple[bool, int]:
        """Check if action is rate limited"""
        if not self.redis:
            return True, 0
        
        key = f"rate_limit:{action}:{identifier}"
        current_time = int(time.time())
        window_start = current_time - self.rate_limit_window
        
        # Remove old entries
        self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        current_count = self.redis.zcard(key)
        
        if current_count >= self.max_requests_per_window:
            ttl = self.redis.ttl(key)
            return False, ttl if ttl > 0 else self.rate_limit_window
        
        # Add current request
        self.redis.zadd(key, {str(current_time): current_time})
        self.redis.expire(key, self.rate_limit_window)
        
        return True, 0
    
    def record_failed_login(self, identifier: str) -> Dict:
        """Record failed login attempt"""
        if not self.redis:
            return {"locked": False, "attempts": 0}
        
        key = f"failed_login:{identifier}"
        attempts = self.redis.incr(key)
        
        if attempts == 1:
            self.redis.expire(key, self.lockout_duration)
        
        if attempts >= self.max_login_attempts:
            # Lock account
            lock_key = f"account_locked:{identifier}"
            self.redis.setex(lock_key, self.lockout_duration, "locked")
            
            return {
                "locked": True,
                "attempts": attempts,
                "unlock_time": datetime.utcnow() + timedelta(seconds=self.lockout_duration)
            }
        
        return {"locked": False, "attempts": attempts}
    
    def clear_failed_logins(self, identifier: str):
        """Clear failed login attempts after successful login"""
        if not self.redis:
            return
        
        self.redis.delete(f"failed_login:{identifier}")
        self.redis.delete(f"account_locked:{identifier}")
    
    def is_account_locked(self, identifier: str) -> Tuple[bool, Optional[datetime]]:
        """Check if account is locked"""
        if not self.redis:
            return False, None
        
        lock_key = f"account_locked:{identifier}"
        if self.redis.exists(lock_key):
            ttl = self.redis.ttl(lock_key)
            unlock_time = datetime.utcnow() + timedelta(seconds=ttl) if ttl > 0 else None
            return True, unlock_time
        
        return False, None
    
    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure token"""
        return secrets.token_urlsafe(length)
    
    def create_session_token(self, user_id: str, device_info: str = "") -> str:
        """Create secure session token with device binding"""
        timestamp = str(int(time.time()))
        data = f"{user_id}:{timestamp}:{device_info}"
        
        # Create HMAC signature
        secret = secrets.token_bytes(32)
        signature = hmac.new(secret, data.encode(), hashlib.sha256).hexdigest()
        
        return f"{data}:{signature}"
    
    def detect_suspicious_activity(self, user_id: str, ip_address: str, user_agent: str) -> Dict:
        """Detect suspicious login patterns"""
        if not self.redis:
            return {"suspicious": False}
        
        # Check for multiple IPs
        ip_key = f"user_ips:{user_id}"
        self.redis.sadd(ip_key, ip_address)
        self.redis.expire(ip_key, 86400)  # 24 hours
        
        ip_count = self.redis.scard(ip_key)
        
        # Check for rapid location changes (simplified)
        location_key = f"user_locations:{user_id}"
        current_time = int(time.time())
        self.redis.zadd(location_key, {ip_address: current_time})
        self.redis.expire(location_key, 3600)  # 1 hour
        
        recent_locations = self.redis.zrangebyscore(
            location_key, current_time - 1800, current_time  # Last 30 minutes
        )
        
        suspicious_indicators = []
        
        if ip_count > 5:
            suspicious_indicators.append("multiple_ips")
        
        if len(recent_locations) > 3:
            suspicious_indicators.append("rapid_location_changes")
        
        # Check for unusual user agent
        ua_key = f"user_agents:{user_id}"
        known_agents = self.redis.smembers(ua_key)
        if known_agents and user_agent.encode() not in known_agents:
            suspicious_indicators.append("new_device")
        
        self.redis.sadd(ua_key, user_agent)
        self.redis.expire(ua_key, 2592000)  # 30 days
        
        return {
            "suspicious": len(suspicious_indicators) > 0,
            "indicators": suspicious_indicators,
            "risk_score": len(suspicious_indicators) * 25  # 0-100 scale
        }
    
    def log_security_event(self, event_type: str, user_id: str, details: Dict):
        """Log security events for monitoring"""
        if not self.redis:
            return
        
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": event_type,
            "user_id": user_id,
            "details": details
        }
        
        # Store in Redis for real-time monitoring
        key = f"security_events:{datetime.utcnow().strftime('%Y-%m-%d')}"
        self.redis.lpush(key, str(event))
        self.redis.expire(key, 604800)  # 7 days
        
        # Keep only last 1000 events per day
        self.redis.ltrim(key, 0, 999)

# Global security manager instance
security_manager = SecurityManager()