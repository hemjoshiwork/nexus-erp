import asyncio
from .database import engine, Base
from .models import User, Product, StockMovement, Company, Supplier, Sale, SaleItem  # Import all models to ensure they are registered

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Optional: Be careful with this in production!
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
