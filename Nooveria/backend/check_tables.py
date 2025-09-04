#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nooveria_prod:OrthoGPT2025Pass@localhost:5432/nooveria")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    tables = [row[0] for row in result]
    print('Tables:', tables)
    
    if 'worlds' not in tables:
        print('Creating worlds table...')
        conn.execute(text('''
            CREATE TABLE worlds (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image_url VARCHAR(500),
                assistant_id VARCHAR(255) NOT NULL,
                tokens_spent INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        '''))
        conn.commit()
        print('Worlds table created')
    
    if 'user_worlds' not in tables:
        print('Creating user_worlds table...')
        conn.execute(text('''
            CREATE TABLE user_worlds (
                id SERIAL PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES users(id),
                world_id INTEGER NOT NULL REFERENCES worlds(id),
                is_pinned BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        '''))
        conn.commit()
        print('User_worlds table created')