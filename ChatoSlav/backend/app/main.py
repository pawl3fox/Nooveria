import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, wallets, admin, devices, config, developer, security
from app.api import chats, assistants
try:
    from app.api import device_linking
except ImportError as e:
    print(f"Warning: Could not import device_linking: {e}")
    device_linking = None
from app.database import engine
from app.models import Base

app = FastAPI(title="OrthodoxGPT API", version="1.0.0")

# CORS configuration for production
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://185.163.45.160:3000,http://185.163.45.160").split(",")
print(f"CORS Origins: {cors_origins}")
# CORS Origins configured

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(wallets.router, prefix="/api/wallets", tags=["wallets"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(devices.router, prefix="/api/devices", tags=["devices"])
app.include_router(config.router, prefix="/api/config", tags=["config"])
app.include_router(security.router, prefix="/api/security", tags=["security"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(assistants.router, prefix="/api/assistants", tags=["assistants"])
if device_linking:
    app.include_router(device_linking.router, prefix="/api/device", tags=["device"])
# Hidden developer endpoints (not in docs)
app.include_router(developer.router, prefix="/api/dev", tags=["developer"], include_in_schema=False)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    
    # Initialize rate limiter with Redis
    try:
        import redis
        from app.middleware.rate_limit import rate_limiter
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        rate_limiter.redis = redis.from_url(redis_url, decode_responses=True)
    except Exception as e:
        print(f"Redis connection failed, using in-memory rate limiting: {e}")
    
    # License validation on startup
    from app.services.license_check import LicenseValidator
    license_info = LicenseValidator.validate_deployment()
    # License validation completed
    
    if not license_info['valid']:
        # Invalid software license detected
        raise RuntimeError("Application cannot start with invalid license")

@app.on_event("shutdown")
async def shutdown():
    # Clean up resources
    from app.services.openai_client import close_http_client
    await close_http_client()

@app.get("/")
async def root():
    return {"message": "OrthodoxGPT API"}

@app.get("/health")
async def health_check():
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }