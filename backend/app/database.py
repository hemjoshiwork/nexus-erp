import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# This explicitly creates the file 'inventory.db' in your main folder
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./inventory.db")

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # THE RENDER FIX: Force SSL for external PostgreSQL connections
    connect_args["ssl"] = "require" 

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args
)

SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    expire_on_commit=False,
    bind=engine, 
    class_=AsyncSession
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session