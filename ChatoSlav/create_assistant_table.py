#!/usr/bin/env python3
"""
Create assistant table manually if migration doesn't exist
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.database import engine
from app.models.assistant import Assistant
from app.models import Base

def create_assistant_table():
    """Create assistant table"""
    print("Creating assistant table...")
    try:
        # Create the assistant table
        Assistant.__table__.create(engine, checkfirst=True)
        print("✓ Assistant table created successfully")
        return True
    except Exception as e:
        print(f"✗ Error creating assistant table: {e}")
        return False

if __name__ == "__main__":
    success = create_assistant_table()
    sys.exit(0 if success else 1)