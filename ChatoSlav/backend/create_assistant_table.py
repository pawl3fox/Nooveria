#!/usr/bin/env python3
"""
Create assistant table - run this inside the backend container
"""

from app.database import engine
from app.models.assistant import Assistant

def create_assistant_table():
    """Create assistant table"""
    print("Creating assistant table...")
    try:
        Assistant.__table__.create(engine, checkfirst=True)
        print("✓ Assistant table created successfully")
        return True
    except Exception as e:
        print(f"✗ Error creating assistant table: {e}")
        return False

if __name__ == "__main__":
    create_assistant_table()