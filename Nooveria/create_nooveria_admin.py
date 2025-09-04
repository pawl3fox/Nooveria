#!/usr/bin/env python3
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Role, Wallet, WalletType
from app.services.auth import get_password_hash

def create_admin():
    db_url = os.getenv("DATABASE_URL", "postgresql://nooveria_prod:OrthoGPT2025Pass@localhost:5433/nooveria")
    
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Get admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            print("❌ Admin role not found. Run init_db.py first.")
            return
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "nooveria@outlook.com").first()
        if existing_admin:
            print("✅ Admin user already exists. Updating password...")
            existing_admin.password_hash = get_password_hash("c9f0a1b2d3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7")
            db.commit()
            print("✅ Admin password updated successfully!")
            return
        
        # Create admin user
        admin_user = User(
            email="nooveria@outlook.com",
            password_hash=get_password_hash("c9f0a1b2d3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7"),
            role_id=admin_role.id,
            display_name="Nooveria Admin",
            is_verified=True
        )
        db.add(admin_user)
        db.flush()
        
        # Create admin wallet
        admin_wallet = Wallet(
            user_id=admin_user.id,
            type=WalletType.personal,
            balance_tokens=100000
        )
        db.add(admin_wallet)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("Email: nooveria@outlook.com")
        print("Password: c9f0a1b2d3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7a9b1c3e5f7")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()