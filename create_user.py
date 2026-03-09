import asyncio
import sys
import os

# Add the current directory to sys.path to allow imports from backend
sys.path.append(os.getcwd())

from backend.app.database import SessionLocal
from backend.app.models import User
from passlib.context import CryptContext

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    async with SessionLocal() as db:
        print("Creating Admin User...")
        
        # 1. Define the user
        email = "admin@nexus.com"
        raw_password = "password123"
        hashed_password = pwd_context.hash(raw_password)
        
        # 2. Create User Object
        new_user = User(
            email=email,
            password_hash=hashed_password,
            role="admin"
        )
        
        # 3. Save to Database
        try:
            db.add(new_user)
            await db.commit()
            print(f"✅ SUCCESS! User created.")
            print(f"Email: {email}")
            print(f"Password: {raw_password}")
        except Exception as e:
            print(f"❌ Error: {e}")
            print("User might already exist.")

if __name__ == "__main__":
    asyncio.run(create_admin())
