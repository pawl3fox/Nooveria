from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import Config
import json

router = APIRouter()

def _get_pricing_info():
    """Helper function to get pricing information"""
    return {
        "token_price_per_1k": Config.TOKEN_PRICE_PER_1K,
        "openai_cost_per_1k": Config.OPENAI_COST_PER_1K,
        "profit_margin": Config.TOKEN_PRICE_PER_1K - Config.OPENAI_COST_PER_1K
    }

@router.get("/roles")
async def get_role_configs():
    """Get all role configurations"""
    return {
        "roles": Config.ROLE_CONFIGS,
        "pricing": _get_pricing_info()
    }

@router.post("/reload")
async def reload_config():
    """Reload configuration from config.json (admin only)"""
    try:
        Config.load_config_file()
        return {"success": True, "message": "Configuration reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reload config: {str(e)}")

@router.get("/pricing")
async def get_pricing():
    """Get current token pricing"""
    return _get_pricing_info()