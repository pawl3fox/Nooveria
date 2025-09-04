#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nooveria_prod:OrthoGPT2025Pass@localhost:5432/nooveria")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE worlds ADD COLUMN tokens_spent INTEGER DEFAULT 0"))
        conn.commit()
        print("Added tokens_spent column to worlds table")
    except Exception as e:
        if "already exists" in str(e):
            print("tokens_spent column already exists")
        else:
            print(f"Error: {e}")