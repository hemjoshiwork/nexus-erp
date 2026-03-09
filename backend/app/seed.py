import asyncio
import logging
from backend.app.database import engine, Base
from backend.app.models import User, Product, Supplier
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup Hash Context (same as auth.py)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def force_create_tables():
    logger.info("🔨 forcing table creation...")
    async with engine.begin() as conn:
        # DANGER: This drops old tables to ensure a clean slate
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Tables created successfully.")

async def seed_data():
    # 1. Create Tables First
    await force_create_tables()

    # 2. Add Admin User
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        logger.info("🌱 Seeding Admin User...")
        # Check if exists (redundant after drop_all, but good practice)
        result = await db.execute(select(User).where(User.email == "admin@nexus.com"))
        existing_user = result.scalars().first()
        
        if not existing_user:
            hashed_password = pwd_context.hash("admin")
            new_user = User(
                email="admin@nexus.com",
                hashed_password=hashed_password,
                role="admin",
                is_active=True
            )
            db.add(new_user)
            await db.commit()
            logger.info("👤 Admin user created: admin@nexus.com / admin")
        else:
            logger.info("⚠️ Admin user already exists.")

if __name__ == "__main__":
    asyncio.run(seed_data())
