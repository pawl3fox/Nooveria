import os
from typing import Dict, Any
import json

class Config:
    # Database & Redis
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/orthodoxgpt")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Security
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
    DEVICE_FINGERPRINT_SECRET = os.getenv("DEVICE_FINGERPRINT_SECRET", "dev-fingerprint-secret")
    
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    # Business Settings (can be overridden by config file)
    @staticmethod
    def safe_int(value: str | None, default: int) -> int:
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default
    
    @staticmethod
    def safe_float(value: str | None, default: float) -> float:
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    DEFAULT_ANONYMOUS_TOKENS = safe_int.__func__(os.getenv("DEFAULT_ANONYMOUS_TOKENS", "50000"), 50000)
    DEFAULT_USER_TOKENS = safe_int.__func__(os.getenv("DEFAULT_USER_TOKENS", "50000"), 50000)
    
    # Token Pricing (your markup)
    TOKEN_PRICE_PER_1K = safe_float.__func__(os.getenv("TOKEN_PRICE_PER_1K", "0.003"), 0.003)
    OPENAI_COST_PER_1K = safe_float.__func__(os.getenv("OPENAI_COST_PER_1K", "0.002"), 0.002)
    
    # Role Configurations
    ROLE_CONFIGS = {
        "anonymous": {
            "daily_communal_limit_tokens": safe_int.__func__(os.getenv("ANON_DAILY_LIMIT", "5000"), 5000),
            "max_request_tokens": safe_int.__func__(os.getenv("ANON_MAX_REQUEST", "2000"), 2000),
            "default_balance": safe_int.__func__(os.getenv("ANON_DEFAULT_BALANCE", "50000"), 50000)
        },
        "user": {
            "daily_communal_limit_tokens": safe_int.__func__(os.getenv("USER_DAILY_LIMIT", "20000"), 20000),
            "max_request_tokens": safe_int.__func__(os.getenv("USER_MAX_REQUEST", "4000"), 4000),
            "default_balance": safe_int.__func__(os.getenv("USER_DEFAULT_BALANCE", "50000"), 50000)
        },
        "admin": {
            "daily_communal_limit_tokens": safe_int.__func__(os.getenv("ADMIN_DAILY_LIMIT", "100000"), 100000),
            "max_request_tokens": safe_int.__func__(os.getenv("ADMIN_MAX_REQUEST", "8000"), 8000),
            "default_balance": safe_int.__func__(os.getenv("ADMIN_DEFAULT_BALANCE", "100000"), 100000)
        }
    }
    
    # Load from config file if exists
    @classmethod
    def load_config_file(cls, config_path: str = "config.json"):
        """Load settings from JSON config file"""
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config_data = json.load(f)
                
                # Update role configs
                if "roles" in config_data:
                    for role, settings in config_data["roles"].items():
                        if role in cls.ROLE_CONFIGS:
                            cls.ROLE_CONFIGS[role].update(settings)
                
                # Update pricing
                if "pricing" in config_data:
                    cls.TOKEN_PRICE_PER_1K = config_data["pricing"].get("token_price_per_1k", cls.TOKEN_PRICE_PER_1K)
                    cls.OPENAI_COST_PER_1K = config_data["pricing"].get("openai_cost_per_1k", cls.OPENAI_COST_PER_1K)
                
                print(f"Loaded config from {config_path}")
        except Exception as e:
            print(f"Warning: Could not load config file {config_path}: {e}")
    
    @classmethod
    def get_role_config(cls, role_name: str) -> Dict[str, Any]:
        """Get configuration for a specific role"""
        return cls.ROLE_CONFIGS.get(role_name, cls.ROLE_CONFIGS["user"])

# Load config on import
Config.load_config_file()