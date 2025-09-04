from hashlib import sha256
import hmac
import os
import json
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models import DeviceFingerprint, User

class DeviceTracker:
    """
    Industry best-practice device tracking used by major services
    Combines multiple signals for robust cross-browser/cross-device detection
    """
    
    def __init__(self):
        self.secret = os.getenv("DEVICE_FINGERPRINT_SECRET")
        if not self.secret:
            raise ValueError("DEVICE_FINGERPRINT_SECRET environment variable is required")
        
        # Initialize Redis connection for security features
        try:
            import redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self.redis = redis.from_url(redis_url, decode_responses=True)
            # Initialize security manager with Redis
            from app.services.security import security_manager
            security_manager.redis = self.redis
        except Exception:
            self.redis = None
    
    def extract_hardware_signals(self, fingerprint_data: Dict) -> Dict:
        """Extract stable hardware characteristics"""
        try:
            data = json.loads(fingerprint_data) if isinstance(fingerprint_data, str) else fingerprint_data
            
            return {
                # Screen hardware (identical across browsers)
                'screen_signature': f"{data.get('screen', '')}-{data.get('availScreen', '')}",
                
                # CPU/Memory (hardware specs)
                'hardware_signature': f"{data.get('hardwareConcurrency', 0)}-{data.get('deviceMemory', 'unknown')}",
                
                # GPU renderer (hardware-specific)
                'gpu_signature': self._normalize_gpu(data.get('webglRenderer', '')),
                
                # Audio hardware
                'audio_signature': data.get('audioHardware', ''),
                
                # System timezone (location-based but stable)
                'timezone_signature': f"{data.get('timezone', '')}-{data.get('timezoneOffset', 0)}",
                
                # Platform (OS level)
                'platform_signature': data.get('platform', ''),
                
                # Touch hardware
                'touch_signature': str(data.get('maxTouchPoints', 0))
            }
        except:
            return {}
    
    def _normalize_gpu(self, gpu_string: str) -> str:
        """Normalize GPU string to focus on hardware model"""
        if not gpu_string:
            return 'unknown'
        
        # Remove driver/API specific info
        normalized = gpu_string.lower()
        
        # Remove common variations
        remove_patterns = [
            'direct3d11', 'direct3d', 'opengl', 'angle', 'mesa',
            'vs_', 'ps_', 'driver', 'version', 'build'
        ]
        
        for pattern in remove_patterns:
            normalized = normalized.replace(pattern, '')
        
        # Extract GPU model (NVIDIA GTX 1060, AMD Radeon, Intel HD, etc.)
        words = normalized.split()
        gpu_model = []
        
        for word in words:
            if any(brand in word for brand in ['nvidia', 'amd', 'intel', 'gtx', 'rtx', 'radeon', 'hd']):
                gpu_model.append(word)
            elif word.isdigit() and len(word) >= 3:  # Model numbers
                gpu_model.append(word)
        
        return '-'.join(gpu_model[:3]) if gpu_model else 'generic'
    
    def create_device_signatures(self, fingerprint_data: Dict) -> Dict[str, str]:
        """Create multiple device signatures for matching"""
        hardware = self.extract_hardware_signals(fingerprint_data)
        
        signatures = {
            # Primary: Full hardware signature
            'primary': self._hash_signature([
                hardware['screen_signature'],
                hardware['hardware_signature'], 
                hardware['gpu_signature'],
                hardware['timezone_signature']
            ]),
            
            # Secondary: Screen + GPU (for different RAM configs)
            'secondary': self._hash_signature([
                hardware['screen_signature'],
                hardware['gpu_signature'],
                hardware['platform_signature']
            ]),
            
            # Tertiary: Basic hardware (for VM/remote desktop)
            'tertiary': self._hash_signature([
                hardware['screen_signature'],
                hardware['timezone_signature'],
                hardware['platform_signature']
            ])
        }
        
        return signatures
    
    def _hash_signature(self, components: List[str]) -> str:
        """Create HMAC hash from signature components"""
        signature_string = '|'.join(filter(None, components))
        return hmac.new(
            self.secret.encode(),
            signature_string.encode(),
            sha256
        ).hexdigest()[:32]
    
    def find_matching_device(self, db: Session, fingerprint_data: Dict) -> Optional[DeviceFingerprint]:
        """
        Find existing device using multi-tier matching
        Similar to how Netflix/Google detect same device across browsers
        """
        signatures = self.create_device_signatures(fingerprint_data)
        
        # Try primary signature first (exact hardware match)
        device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.fingerprint_hash == signatures['primary']
        ).first()
        
        if device:
            return device
        
        # Try secondary signature (same screen + GPU, different RAM)
        device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.fingerprint_hash == signatures['secondary']
        ).first()
        
        if device:
            # Update to primary signature for future matches
            device.fingerprint_hash = signatures['primary']
            db.commit()
            return device
        
        # Try tertiary signature (basic hardware match)
        device = db.query(DeviceFingerprint).filter(
            DeviceFingerprint.fingerprint_hash == signatures['tertiary']
        ).first()
        
        if device:
            # Update to primary signature
            device.fingerprint_hash = signatures['primary']
            db.commit()
            return device
        
        return None
    
    def create_device_record(self, db: Session, fingerprint_data: Dict) -> DeviceFingerprint:
        """Create new device record with primary signature"""
        signatures = self.create_device_signatures(fingerprint_data)
        
        device = DeviceFingerprint(
            fingerprint_hash=signatures['primary'],
            device_metadata={
                'signatures': signatures,
                'hardware_profile': self.extract_hardware_signals(fingerprint_data),
                'raw_fingerprint': fingerprint_data
            }
        )
        
        db.add(device)
        db.flush()
        return device

# Global instance
device_tracker = DeviceTracker()