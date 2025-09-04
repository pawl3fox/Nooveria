import secrets
import hmac
import hashlib
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware for state-changing requests
    """
    
    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.safe_methods = {"GET", "HEAD", "OPTIONS", "TRACE"}
        
    def generate_csrf_token(self, session_id: str = None) -> str:
        """Generate CSRF token for session"""
        session_id = session_id or secrets.token_urlsafe(16)
        token_data = f"{session_id}:{secrets.token_urlsafe(16)}"
        
        signature = hmac.new(
            self.secret_key.encode(),
            token_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{token_data}:{signature}"
    
    def validate_csrf_token(self, token: str, session_id: str = None) -> bool:
        """Validate CSRF token"""
        try:
            if not token or token.count(':') != 2:
                return False
                
            token_session, token_random, signature = token.split(':')
            token_data = f"{token_session}:{token_random}"
            
            expected_signature = hmac.new(
                self.secret_key.encode(),
                token_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
        except Exception:
            return False
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF check for safe methods
        if request.method in self.safe_methods:
            return await call_next(request)
        
        # Skip CSRF check for API documentation and health endpoints
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health", "/"]:
            return await call_next(request)
        
        # Get CSRF token from header
        csrf_token = request.headers.get("X-CSRF-Token")
        
        if not csrf_token:
            return JSONResponse(
                status_code=403,
                content={"detail": "CSRF token missing"}
            )
        
        if not self.validate_csrf_token(csrf_token):
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid CSRF token"}
            )
        
        return await call_next(request)

# Helper function to get CSRF token for frontend
def get_csrf_token_for_session(session_id: str = None) -> str:
    """Generate CSRF token for frontend use"""
    middleware = CSRFMiddleware(None)
    return middleware.generate_csrf_token(session_id)