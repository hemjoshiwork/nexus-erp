import asyncio
from backend.app.database import SessionLocal
from backend.app.models import User
from backend.app.core.security import get_password_hash
from sqlalchemy import select

async def reset_admin():
    print("🔄 Connecting to Database...")
    async with SessionLocal() as db:
        # 1. Find existing admin (if any)
        result = await db.execute(select(User).filter(User.email == "admin@nexus.com"))
        user = result.scalar_one_or_none()

        # 2. Delete old broken admin
        if user:
            await db.delete(user)
            await db.commit()
            print("🗑️  Old/Broken Admin user deleted.")

        # 3. Create NEW Admin with correct password hash
        print("✨ Creating fresh Admin user...")
        hashed_pwd = get_password_hash("admin") # Password is "admin"
        new_admin = User(
            email="admin@nexus.com",
            hashed_password=hashed_pwd,
            role="admin",
            is_active=True
        )
        db.add(new_admin)
        await db.commit()
        
        print("\n✅ SUCCESS! Login Fixed.")
        print("--------------------------------")
        print("📧 Email:    admin@nexus.com")
        print("🔑 Password: admin")
        print("--------------------------------")

if __name__ == "__main__":
    asyncio.run(reset_admin())
