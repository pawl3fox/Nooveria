import hashlib
import hmac
import os
from typing import Optional
from sqlalchemy.orm import Session
from app.models import DeviceFingerprint, User

def normalize_fingerprint(fingerprint_data: str) -> str:
    """
    Normalize fingerprint to handle minor variations across browsers
    """
    # Remove browser-specific noise
    normalized = fingerprint_data.lower()
    
    # Remove common browser variations in single pass
    import re
    noise_pattern = r'(chrome|firefox|safari|edge|opera|webkit|gecko|blink|trident|version/|rv:|opr/|edg/)'
    normalized = re.sub(noise_pattern, '', normalized)
    
    return normalized.strip()

def find_similar_device(db: Session, fingerprint_hash: str, fingerprint_data: str) -> Optional[DeviceFingerprint]:
    """
    Find existing device by exact match or similar hardware characteristics
    """
    # First try exact match with parameterized query
    device = db.query(DeviceFingerprint).filter(
        DeviceFingerprint.fingerprint_hash == fingerprint_hash
    ).first()
    
    if device:
        return device
    
    # If no exact match, look for similar devices (same hardware, different browser)
    # This is a simplified similarity check - in production you might want more sophisticated matching
    all_devices = db.query(DeviceFingerprint).all()
    
    normalized_new = normalize_fingerprint(fingerprint_data)
    
    for existing_device in all_devices:
        if existing_device.device_metadata and 'raw_fingerprint' in existing_device.device_metadata:
            existing_normalized = normalize_fingerprint(existing_device.device_metadata['raw_fingerprint'])
            
            # Calculate similarity (simple approach)
            similarity = calculate_similarity(normalized_new, existing_normalized)
            
            # If 80%+ similar, consider it the same device
            if similarity > 0.8:
                return existing_device
    
    return None

def calculate_similarity(str1: str, str2: str) -> float:
    """
    Calculate similarity between two fingerprint strings
    """
    if not str1 or not str2:
        return 0.0
    
    # Simple character-based similarity
    set1 = set(str1)
    set2 = set(str2)
    
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0

def create_enhanced_fingerprint_hash(fingerprint_data: str) -> str:
    """
    Create hash that focuses on hardware characteristics
    """
    # Normalize first to reduce browser variations
    normalized = normalize_fingerprint(fingerprint_data)
    
    # Create hash
    secret = os.getenv("DEVICE_FINGERPRINT_SECRET", "dev-fingerprint-secret")
    return hmac.new(
        secret.encode(),
        normalized.encode(),
        hashlib.sha256
    ).hexdigest()