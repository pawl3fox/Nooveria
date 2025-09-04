#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nooveria_prod:OrthoGPT2025Pass@localhost:5432/nooveria")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS wallet_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            event_type VARCHAR(50) NOT NULL,
            amount NUMERIC(15,2) NOT NULL,
            description TEXT NOT NULL,
            chat_id UUID,
            world_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    
    conn.commit()

print("Wallet events table created successfully")