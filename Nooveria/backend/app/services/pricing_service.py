from typing import Dict, Optional
import json
from datetime import datetime, timedelta
import os

class PricingService:
    def __init__(self):
        self.cache = {}
        self.cache_expiry = None
        self.cache_duration = timedelta(hours=24)  # Cache for 24 hours
        self.markup_multiplier = float(os.getenv("PRICING_MARKUP", "2.0"))
        
        # Fallback pricing (per 1M tokens) if API fails
        self.fallback_pricing = {
            "gpt-4o": {"input": 2.50, "output": 10.00},
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4-turbo": {"input": 10.00, "output": 30.00},
            "gpt-4": {"input": 30.00, "output": 60.00},
            "gpt-3.5-turbo": {"input": 0.50, "output": 1.50}
        }
    
    def _is_cache_valid(self) -> bool:
        return (self.cache_expiry and 
                datetime.now() < self.cache_expiry and 
                bool(self.cache))
    
    def _fetch_openai_pricing(self) -> Optional[Dict]:
        """Fetch pricing from OpenAI's website (web scraping fallback)"""
        try:
            # This would need to be implemented based on OpenAI's current pricing page structure
            # For now, return None to use fallback pricing
            return None
        except Exception as e:
            print(f"Failed to fetch OpenAI pricing: {e}")
            return None
    
    def get_model_pricing(self, model_name: str) -> Dict[str, float]:
        """Get pricing for a specific model with markup applied"""
        if not self._is_cache_valid():
            self._update_cache()
        
        # Normalize model name
        normalized_model = self._normalize_model_name(model_name)
        
        if normalized_model in self.cache:
            pricing = self.cache[normalized_model]
        else:
            # Use fallback pricing
            pricing = self.fallback_pricing.get(normalized_model, self.fallback_pricing["gpt-4o-mini"])
        
        # Apply markup
        return {
            "input": pricing["input"] * self.markup_multiplier,
            "output": pricing["output"] * self.markup_multiplier
        }
    
    def _normalize_model_name(self, model_name: str) -> str:
        """Normalize model name to match pricing keys"""
        model_name = model_name.lower()
        
        if "gpt-4o-mini" in model_name:
            return "gpt-4o-mini"
        elif "gpt-4o" in model_name:
            return "gpt-4o"
        elif "gpt-4-turbo" in model_name:
            return "gpt-4-turbo"
        elif "gpt-4" in model_name:
            return "gpt-4"
        elif "gpt-3.5" in model_name:
            return "gpt-3.5-turbo"
        else:
            return "gpt-4o-mini"  # Default to cheapest model
    
    def _update_cache(self):
        """Update pricing cache"""
        try:
            # Try to fetch from OpenAI (not available, so use fallback)
            fetched_pricing = self._fetch_openai_pricing()
            
            if fetched_pricing:
                self.cache = fetched_pricing
            else:
                # Use fallback pricing
                self.cache = self.fallback_pricing.copy()
            
            self.cache_expiry = datetime.now() + self.cache_duration
            print(f"Pricing cache updated with {len(self.cache)} models")
            
        except Exception as e:
            print(f"Failed to update pricing cache: {e}")
            # Use fallback pricing
            self.cache = self.fallback_pricing.copy()
            self.cache_expiry = datetime.now() + self.cache_duration
    
    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost for a specific request"""
        pricing = self.get_model_pricing(model_name)
        
        # Convert from per-1M-tokens to per-token
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        return input_cost + output_cost
    
    def get_all_pricing(self) -> Dict:
        """Get all model pricing with markup"""
        if not self._is_cache_valid():
            self._update_cache()
        
        result = {}
        for model, pricing in self.cache.items():
            result[model] = {
                "input": pricing["input"] * self.markup_multiplier,
                "output": pricing["output"] * self.markup_multiplier
            }
        
        return result

# Global instance
pricing_service = PricingService()