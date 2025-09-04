#!/usr/bin/env python3
"""
Set password for existing admin user
"""
import os
import sys
import getpass
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Role
from app.services.auth import get_password_hash

def set_admin_password():
    """Set password for admin user"""
    
    # Get database URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not found in environment")
        print("Make sure to run: source .env")
        return
    
    # Get admin email
    admin_email = input("Enter admin email: ").strip().lower()
    if not admin_email:
        print("❌ Email is required")
        return
    
    # Get password
    password = getpass.getpass("Enter new admin password: ")
    if not password:
        print("❌ Password is required")
        return
    
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("❌ Passwords don't match")
        return
    
    try:
        # Connect to database
        engine = create_engine(db_url)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        # Find admin user
        admin_user = db.query(User).filter(User.email == admin_email).first()
        
        if not admin_user:
            print(f"❌ Admin user with email {admin_email} not found")
            print("Available users:")
            users = db.query(User).filter(User.email.isnot(None)).all()
            for user in users:
                print(f"  - {user.email} (role: {user.role.name if user.role else 'none'})")
            return
        
        # Check if user is admin
        if not admin_user.role or admin_user.role.name != 'admin':
            print(f"❌ User {admin_email} is not an admin")
            print(f"Current role: {admin_user.role.name if admin_user.role else 'none'}")
            return
        
        # Set password
        admin_user.password_hash = get_password_hash(password)
        db.commit()
        
        print(f"✅ Password set successfully for admin: {admin_email}")
        print("You can now login to the admin panel with this password")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    set_admin_password()