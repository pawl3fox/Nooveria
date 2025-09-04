from fastapi import APIRouter
from app.services.pricing_service import pricing_service

router = APIRouter()

@router.get("/pricing")
async def get_current_pricing():
    """Get current pricing for all models with markup applied"""
    return {
        "pricing": pricing_service.get_all_pricing(),
        "markup_multiplier": pricing_service.markup_multiplier,
        "last_updated": pricing_service.cache_expiry.isoformat() if pricing_service.cache_expiry else None
    }

@router.get("/pricing/{model_name}")
async def get_model_pricing(model_name: str):
    """Get pricing for a specific model"""
    return {
        "model": model_name,
        "pricing": pricing_service.get_model_pricing(model_name),
        "markup_multiplier": pricing_service.markup_multiplier
    }