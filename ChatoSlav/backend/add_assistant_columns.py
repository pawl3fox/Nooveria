#!/usr/bin/env python3
"""
Add missing columns to assistants table
"""

from app.database import engine
from sqlalchemy import text

def add_assistant_columns():
    """Add missing columns to assistants table"""
    print("Adding missing columns to assistants table...")
    try:
        with engine.connect() as conn:
            # Add assistant_id column
            try:
                conn.execute(text("ALTER TABLE assistants ADD COLUMN assistant_id VARCHAR(255)"))
                print("✓ Added assistant_id column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ assistant_id column already exists")
                else:
                    print(f"✗ Error adding assistant_id: {e}")
            
            # Add use_openai_assistant column
            try:
                conn.execute(text("ALTER TABLE assistants ADD COLUMN use_openai_assistant BOOLEAN DEFAULT FALSE"))
                print("✓ Added use_openai_assistant column")
            except Exception as e:
                if "already exists" in str(e):
                    print("✓ use_openai_assistant column already exists")
                else:
                    print(f"✗ Error adding use_openai_assistant: {e}")
            
            # Make system_prompt nullable
            try:
                conn.execute(text("ALTER TABLE assistants ALTER COLUMN system_prompt DROP NOT NULL"))
                print("✓ Made system_prompt nullable")
            except Exception as e:
                print(f"Note: system_prompt nullable change: {e}")
            
            conn.commit()
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    add_assistant_columns()