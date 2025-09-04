from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import re
from app.database import get_db
from app.services.admin_safeguards import AdminSafeguards

router = APIRouter()

class DeveloperRequest(BaseModel):
    master_key: str = Field(
        min_length=32,
        max_length=128,
        pattern=r'^[a-fA-F0-9]+$',
        description="Hexadecimal master key"
    )

class DeveloperAccessRequest(BaseModel):
    master_key: str = Field(
        min_length=32,
        max_length=128,
        pattern=r'^[a-fA-F0-9]+$',
        description="Hexadecimal master key"
    )
    action: str = Field(
        pattern=r'^[a-z_]+$',
        description="Valid action name"
    )

@router.post("/verify")
async def verify_developer_access(request: DeveloperRequest):
    """Verify developer credentials (hidden endpoint)"""
    try:
        is_valid = AdminSafeguards.verify_developer_access(request.master_key)
        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        return {"status": "verified", "developer": True}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Access denied")

@router.post("/emergency-access")
async def emergency_access(
    request: DeveloperAccessRequest,
    db: Session = Depends(get_db)
):
    """Emergency developer access (use only if needed)"""
    try:
        if request.action == "create_access":
            result = AdminSafeguards.create_developer_access(db, request.master_key)
            return result
        elif request.action == "system_info":
            result = AdminSafeguards.emergency_system_info(db, request.master_key)
            return result
        elif request.action == "integrity_check":
            result = AdminSafeguards.verify_system_integrity(request.master_key)
            return result
        elif request.action == "collect_evidence":
            from app.services.protection_system import ProtectionSystem
            result = ProtectionSystem.collect_system_evidence(db, request.master_key)
            return result
        elif request.action == "generate_report":
            from app.services.protection_system import ProtectionSystem
            report = ProtectionSystem.create_evidence_report(db, request.master_key)
            return {"report": report}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))