from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
import subprocess
import os
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Role, Wallet, Transaction, WalletType
from app.services.auth import verify_token
from app.services.security import security_manager
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_token_from_header(request: Request):
    """Extract token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ")[1]

def verify_admin_token(request: Request):
    """Verify JWT token from request header"""
    try:
        token = get_token_from_header(request)
        if not token:
            return None
        return verify_token(token)
    except Exception:
        return None
from app.services.admin_safeguards import AdminSafeguards

router = APIRouter()

def get_current_admin_user(request: Request, db: Session = Depends(get_db)):
    """Verify admin access with CSRF protection"""
    # Check for state-changing methods
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        referer = request.headers.get("referer")
        origin = request.headers.get("origin")
        host = request.headers.get("host")
        
        # Basic CSRF protection - ensure request comes from same origin
        if not (referer and (f"://{host}" in referer or origin == f"http://{host}" or origin == f"https://{host}")):
            raise HTTPException(status_code=403, detail="CSRF protection: Invalid origin")
    
    token_data = verify_admin_token(request)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == token_data["sub"]).first()
    if not user or user.role.name != "admin":
        # Log unauthorized admin access attempt
        security_manager.log_security_event(
            "unauthorized_admin_access",
            token_data.get("sub", "unknown"),
            {"ip": request.client.host if hasattr(request, 'client') else "unknown"}
        )
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

# Global error log storage (in production, use proper logging system)
error_logs = []

def log_error(level: str, message: str, traceback: str = None):
    """Add error to log"""
    global error_logs
    error_logs.append({
        "timestamp": datetime.utcnow().isoformat(),
        "level": level,
        "message": message,
        "traceback": traceback
    })
    # Keep only last 100 logs
    if len(error_logs) > 100:
        error_logs = error_logs[-100:]

@router.get("/stats")
async def get_admin_stats(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Get system statistics"""
    try:
        # Basic stats
        total_users = db.query(User).count()
        
        # Safe role counting
        try:
            anonymous_users = db.query(User).join(Role).filter(Role.name == "anonymous").count()
        except:
            anonymous_users = 0
        
        registered_users = total_users - anonymous_users
        
        # Token usage - safe query
        try:
            total_tokens_used = db.query(func.sum(Transaction.amount_tokens)).scalar() or 0
        except:
            total_tokens_used = 0
        
        # Revenue calculation (rough estimate: $0.004 per 1000 tokens)
        revenue_usd = round((float(total_tokens_used) * 0.004) / 1000, 2)
        
        # Active sessions - simplified
        active_sessions = 0  # Simplified for now
        
        return {
            "total_users": total_users,
            "registered_users": registered_users,
            "anonymous_users": anonymous_users,
            "active_sessions": active_sessions,
            "total_tokens_used": int(total_tokens_used),
            "revenue_usd": revenue_usd,
            "system_status": "operational"
        }
    except Exception as e:
        import traceback
        error_msg = f"Failed to get admin stats: {str(e)}\n{traceback.format_exc()}"
        log_error("ERROR", error_msg)
        print(error_msg)  # Also print to console
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@router.get("/users")
async def get_users(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Get all users with wallet info"""
    try:
        users = db.query(User).join(Role).all()
        result = []
        
        for user in users:
            wallet = db.query(Wallet).filter(
                Wallet.user_id == user.id,
                Wallet.type == WalletType.personal
            ).first()
            
            result.append({
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name,
                "role": user.role.name,
                "wallet_balance": float(wallet.balance_tokens) if wallet else 0,
                "created_at": user.created_at.isoformat(),
                "is_verified": user.is_verified
            })
        
        return result
    except Exception as e:
        log_error("ERROR", f"Failed to get users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get users")

@router.get("/logs")
async def get_error_logs(current_user: User = Depends(get_current_admin_user)):
    """Get error logs"""
    try:
        # Return recent logs, newest first
        return sorted(error_logs, key=lambda x: x["timestamp"], reverse=True)
    except Exception as e:
        log_error("ERROR", f"Failed to get logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get logs")

@router.delete("/logs")
async def clear_error_logs(current_user: User = Depends(get_current_admin_user)):
    """Clear error logs"""
    try:
        global error_logs
        error_logs = []
        return {"message": "Logs cleared successfully"}
    except Exception as e:
        log_error("ERROR", f"Failed to clear logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear logs")

@router.post("/restart/{service}")
async def restart_service(service: str, current_user: User = Depends(get_current_admin_user)):
    """Restart a service (mock implementation for security)"""
    try:
        allowed_services = ["backend", "frontend", "postgres", "redis"]
        if service not in allowed_services:
            raise HTTPException(status_code=400, detail="Invalid service")
        
        # In production, this would actually restart services
        # For now, just log the action
        log_error("INFO", f"Admin {current_user.email} requested restart of {service}")
        
        return {
            "message": f"Restart request for {service} logged",
            "note": "Service restart requires manual intervention for security"
        }
    except Exception as e:
        log_error("ERROR", f"Failed to restart {service}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to restart {service}")

@router.get("/transactions")
async def get_recent_transactions(current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Get recent transactions with optimized query"""
    try:
        # Use join to avoid N+1 query problem
        from sqlalchemy.orm import joinedload
        transactions = db.query(Transaction).options(
            joinedload(Transaction.wallet_from),
            joinedload(Transaction.wallet_to)
        ).order_by(desc(Transaction.created_at)).limit(50).all()
        
        result = []
        for tx in transactions:
            # Get user from wallet relationship instead of separate query
            user_email = "System"
            if tx.wallet_from and tx.wallet_from.user:
                user_email = tx.wallet_from.user.email or "Anonymous"
            
            result.append({
                "id": str(tx.id),
                "user_email": user_email,
                "type": tx.type.value if hasattr(tx.type, 'value') else str(tx.type),
                "amount_tokens": float(tx.amount_tokens),
                "created_at": tx.created_at.isoformat()
            })
        
        return result
    except Exception as e:
        log_error("ERROR", f"Failed to get transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get transactions")

@router.get("/files")
async def get_project_files(current_user: User = Depends(get_current_admin_user)):
    """Get list of editable project files"""
    try:
        files = []
        project_root = "/app"  # Docker container path
        
        # Define editable file patterns
        editable_patterns = [
            "*.py", "*.js", "*.jsx", "*.json", "*.yml", "*.yaml", 
            "*.env*", "*.md", "*.txt", "*.conf", "*.cfg"
        ]
        
        import os
        import fnmatch
        
        # Use os.walk for better performance with early filtering
        for root, dirs, filenames in os.walk(project_root):
            # Skip unwanted directories early
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', '.pytest_cache']]
            
            for filename in filenames:
                # Check if file matches any pattern
                if any(fnmatch.fnmatch(filename, pattern) for pattern in editable_patterns):
                    filepath = os.path.join(root, filename)
                    files.append({
                        "name": filename,
                        "path": filepath,
                        "relative_path": filepath.replace(project_root, "").lstrip("/")
                    })
                    
            # Limit depth to prevent excessive traversal
            if root.count(os.sep) - project_root.count(os.sep) >= 5:
                dirs.clear()
        
        return sorted(files, key=lambda x: x["path"])
    except Exception as e:
        log_error("ERROR", f"Failed to get files: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get files")

@router.get("/files/content")
async def get_file_content(path: str, current_user: User = Depends(get_current_admin_user)):
    """Get content of a specific file"""
    try:
        # Security check - prevent path traversal
        normalized_path = os.path.normpath(path)
        if not normalized_path.startswith("/app/") or ".." in path:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Additional check for resolved path
        real_path = os.path.realpath(normalized_path)
        if not real_path.startswith("/app/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        if not os.path.exists(real_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(real_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {"content": content, "path": path}
    except Exception as e:
        log_error("ERROR", f"Failed to get file content: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get file content")

@router.post("/files/save")
async def save_file_content(request: dict, current_user: User = Depends(get_current_admin_user)):
    """Save content to a file"""
    try:
        path = request.get("path")
        content = request.get("content")
        
        if not path or content is None:
            raise HTTPException(status_code=400, detail="Path and content required")
        
        # Security check - prevent path traversal
        normalized_path = os.path.normpath(path)
        if not normalized_path.startswith("/app/") or ".." in path:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Additional check for resolved path
        real_path = os.path.realpath(normalized_path)
        if not real_path.startswith("/app/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Backup original file
        if os.path.exists(real_path):
            backup_path = f"{real_path}.backup"
            import shutil
            shutil.copy2(real_path, backup_path)
        
        # Save new content
        with open(real_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        log_error("INFO", f"Admin {current_user.email} saved file: {real_path}")
        return {"message": "File saved successfully", "path": path}
    except Exception as e:
        log_error("ERROR", f"Failed to save file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save file")

@router.post("/restart-all")
async def restart_all_services(current_user: User = Depends(get_current_admin_user)):
    """Restart all services (Docker Compose)"""
    try:
        # In production, this would restart docker-compose
        log_error("INFO", f"Admin {current_user.email} requested full service restart")
        
        # For security, just log the request
        return {
            "message": "Service restart requested",
            "note": "Manual restart required: docker-compose restart"
        }
    except Exception as e:
        log_error("ERROR", f"Failed to restart services: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to restart services")

@router.post("/create-device-session")
async def create_device_session(request: dict, current_user: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    """Admin-only: Create new device session for hardware-based detection"""
    try:
        device_fingerprint = request.get("device_fingerprint")
        if not device_fingerprint:
            raise HTTPException(status_code=400, detail="Device fingerprint required")
        
        from app.services.device_tracking import device_tracker
        from app.services.auth import create_anonymous_user, create_access_token
        from app.models import WalletType
        
        # Create new user and device record
        user = create_anonymous_user(db, "admin-created")
        device_record = device_tracker.create_device_record(db, device_fingerprint)
        device_record.bound_user_id = user.id
        
        db.commit()
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id), "role": "anonymous"})
        
        # Get wallet balance
        wallet = db.query(Wallet).filter(
            Wallet.user_id == user.id,
            Wallet.type == WalletType.personal
        ).first()
        
        log_error("INFO", f"Admin {current_user.email} created device session for new hardware")
        
        return {
            "session_token": access_token,
            "user_id": str(user.id),
            "role": "anonymous",
            "personal_wallet_balance": float(wallet.balance_tokens) if wallet else 0,
            "message": "Device session created successfully"
        }
    except Exception as e:
        log_error("ERROR", f"Failed to create device session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create device session")

# Add error logging to other parts of the application
def setup_error_logging():
    """Setup error logging for the application"""
    import logging
    
    class AdminLogHandler(logging.Handler):
        def emit(self, record):
            if record.levelno >= logging.ERROR:
                log_error(
                    record.levelname,
                    record.getMessage(),
                    self.format(record) if record.exc_info else None
                )
    
    # Check if handler already exists to prevent duplicates
    root_logger = logging.getLogger()
    handler_exists = any(isinstance(h, AdminLogHandler) for h in root_logger.handlers)
    
    if not handler_exists:
        root_logger.addHandler(AdminLogHandler())