import os
from typing import List, Dict, Any
import asyncio
import random
import httpx

# Mock mode for development
MOCK_MODE = os.getenv("OPENAI_API_KEY", "").startswith("mock-") or not os.getenv("OPENAI_API_KEY")

# Connection pooling for production - will be closed properly
_http_client = None

def get_http_client():
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
            timeout=httpx.Timeout(30.0)
        )
    return _http_client

async def close_http_client():
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None

if not MOCK_MODE:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        http_client=get_http_client()
    )

async def chat_completion(messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo") -> Dict[str, Any]:
    """
    Call OpenAI API with connection pooling or return mock response.
    CRITICAL: This function does NOT store any chat content.
    """
    if MOCK_MODE:
        # Mock response for development
        await asyncio.sleep(0.5)  # Simulate API delay
        
        mock_responses = [
            "This is a mock response from OrthodoxGPT. The real OpenAI integration will work once you add your API key.",
            "Hello! I'm a simulated AI response for development purposes. Your wallet system and billing are working correctly.",
            "Mock AI: I can help you test the frontend while you develop. Add OPENAI_API_KEY to .env for real responses.",
            "Development mode active. This response simulates OpenAI's API without making real calls or charges."
        ]
        
        content = random.choice(mock_responses)
        tokens_used = len(content.split()) * 2  # Rough token estimate
        
        return {
            "message": {
                "role": "assistant", 
                "content": content
            },
            "usage": {
                "prompt_tokens": random.randint(10, 50),
                "completion_tokens": tokens_used,
                "total_tokens": tokens_used + random.randint(10, 50)
            },
            "model": "mock-gpt-3.5-turbo",
            "id": f"mock-{random.randint(1000, 9999)}"
        }
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=4000
        )
        
        return {
            "message": {
                "role": "assistant",
                "content": response.choices[0].message.content
            },
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "model": response.model,
            "id": response.id
        }
    except Exception as e:
        raise Exception(f"OpenAI API error: {str(e)}")