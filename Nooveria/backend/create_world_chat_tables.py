#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nooveria_prod:OrthoGPT2025Pass@localhost:5432/nooveria")
engine = create_engine(DATABASE_URL)

# Create tables directly with SQL
with engine.connect() as conn:
    # Create world_chats table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS world_chats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            world_id INTEGER NOT NULL REFERENCES worlds(id),
            openai_thread_id VARCHAR(255) NOT NULL UNIQUE,
            title VARCHAR(255) DEFAULT 'World Chat',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    
    # Create world_chat_messages table
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS world_chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            world_chat_id UUID NOT NULL REFERENCES world_chats(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            openai_message_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    
    conn.commit()

print("World chat tables created successfully")