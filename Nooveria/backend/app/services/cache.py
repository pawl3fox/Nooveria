import os
import json
import redis
from typing import Optional, Any

# Redis connection with connection pooling
redis_client = redis.ConnectionPool.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    max_connections=20
)
cache = redis.Redis(connection_pool=redis_client)

class CacheService:
    @staticmethod
    def get_user_wallet_cache(user_id: str) -> Optional[dict]:
        """Get cached wallet data"""
        try:
            data = cache.get(f"wallet:{user_id}")
            return json.loads(data) if data else None
        except redis.RedisError:
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    @staticmethod
    def set_user_wallet_cache(user_id: str, wallet_data: dict, ttl: int = 300):
        """Cache wallet data for 5 minutes"""
        try:
            cache.setex(f"wallet:{user_id}", ttl, json.dumps(wallet_data))
        except redis.RedisError:
            # Log Redis connection issues but don't crash
            pass
        except Exception as e:
            # Log unexpected errors for debugging
            print(f"Cache set error: {e}")
            pass
    
    @staticmethod
    def invalidate_user_wallet_cache(user_id: str):
        """Remove wallet cache after transaction"""
        try:
            cache.delete(f"wallet:{user_id}")
        except redis.RedisError:
            pass
        except Exception as e:
            print(f"Cache delete error: {e}")
            pass
    
    @staticmethod
    def get_daily_usage(user_id: str) -> int:
        """Get daily communal usage counter"""
        try:
            usage = cache.get(f"daily_usage:{user_id}")
            return int(usage) if usage else 0
        except redis.RedisError:
            return 0
        except Exception as e:
            print(f"Cache get error: {e}")
            return 0
    
    @staticmethod
    def increment_daily_usage(user_id: str, tokens: int) -> int:
        """Increment daily usage with expiration"""
        try:
            key = f"daily_usage:{user_id}"
            pipe = cache.pipeline()
            pipe.incrby(key, tokens)
            pipe.expire(key, 86400)  # 24 hours
            result = pipe.execute()
            return result[0]
        except redis.RedisError:
            return tokens
        except Exception as e:
            print(f"Cache increment error: {e}")
            return tokens