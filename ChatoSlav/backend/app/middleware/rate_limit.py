import time
import redis
from fastapi import HTTPException, Request
from typing import Optional

class RateLimiter:
    """Rate limiting middleware for auth endpoints"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis = redis_client
        self.fallback_store = {}  # In-memory fallback
    
    def check_rate_limit(self, key: str, limit: int, window: int) -> bool:
        """Check if request is within rate limit"""
        current_time = int(time.time())
        window_start = current_time - window
        
        if self.redis:
            try:
                # Use Redis for distributed rate limiting
                pipe = self.redis.pipeline()
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zcard(key)
                pipe.zadd(key, {str(current_time): current_time})
                pipe.expire(key, window)
                results = pipe.execute()
                
                current_requests = results[1]
                return current_requests < limit
            except:
                # Fallback to in-memory
                pass
        
        # In-memory fallback
        if key not in self.fallback_store:
            self.fallback_store[key] = []
        
        # Clean old entries
        self.fallback_store[key] = [
            timestamp for timestamp in self.fallback_store[key]
            if timestamp > window_start
        ]
        
        # Check limit
        if len(self.fallback_store[key]) >= limit:
            return False
        
        # Add current request
        self.fallback_store[key].append(current_time)
        return True
    
    def get_client_key(self, request: Request, endpoint: str) -> str:
        """Generate rate limit key for client"""
        # Use IP address as primary identifier
        client_ip = request.client.host
        
        # Add user agent hash for additional uniqueness
        user_agent = request.headers.get("user-agent", "")
        ua_hash = str(hash(user_agent))[:8]
        
        return f"rate_limit:{endpoint}:{client_ip}:{ua_hash}"

# Global rate limiter instance
rate_limiter = RateLimiter()

def check_auth_rate_limit(request: Request, endpoint: str):
    """Check rate limit for auth endpoints"""
    limits = {
        "register": (5, 3600),  # 5 registrations per hour
        "login": (10, 900),     # 10 login attempts per 15 minutes
        "anon": (20, 3600)      # 20 anonymous sessions per hour
    }
    
    if endpoint not in limits:
        return
    
    limit, window = limits[endpoint]
    key = rate_limiter.get_client_key(request, endpoint)
    
    if not rate_limiter.check_rate_limit(key, limit, window):
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded for {endpoint}. Try again later."
        )