#!/usr/bin/env python3
"""
Initialize database with default roles and communal wallet.
Run this script after creating the database schema.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Base, Role, Wallet, WalletType, User, Chat, ChatMessage
from app.services.auth import get_password_hash

def init_database():
    """Initialize database with default data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default roles if they don't exist
        roles_data = [
            {
                "name": "anonymous",
                "display_name": "Anonymous User",
                "daily_communal_limit_tokens": 5000,
                "max_request_tokens": 2000
            },
            {
                "name": "user",
                "display_name": "Registered User",
                "daily_communal_limit_tokens": 20000,
                "max_request_tokens": 4000
            },
            {
                "name": "admin",
                "display_name": "Administrator",
                "daily_communal_limit_tokens": 100000,
                "max_request_tokens": 8000
            }
        ]
        
        for role_data in roles_data:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                role = Role(**role_data)
                db.add(role)
                print(f"Created role: {role_data['name']}")
        
        # Create communal wallet if it doesn't exist
        communal_wallet = db.query(Wallet).filter(Wallet.type == WalletType.communal).first()
        if not communal_wallet:
            communal_wallet = Wallet(
                user_id=None,
                type=WalletType.communal,
                balance_tokens=1000000  # 1M tokens initial communal fund
            )
            db.add(communal_wallet)
            print("Created communal wallet with 1,000,000 tokens")
        
        # Create admin user if it doesn't exist
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if admin_role:
            admin_user = db.query(User).filter(User.email == "admin@orthodox.com").first()
            if not admin_user:
                admin_user = User(
                    email="admin@orthodox.com",
                    password_hash=get_password_hash("admin123"),
                    role_id=admin_role.id,
                    display_name="Administrator",
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
                print("Created admin user: admin@orthodox.com / admin123")
        
        db.commit()
        print("Database initialization completed successfully!")
        print("Admin login: admin@orthodox.com / admin123")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_database()