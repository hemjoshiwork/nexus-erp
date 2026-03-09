from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from . import models, schemas

async def create_stock_movement_transaction(db: AsyncSession, movement: schemas.StockMovementCreate, user_id: int):
    # CRITICAL: This needs to run in a transaction
    # Since we depend on a session from `get_db` which is usually auto-commit false but not strictly a transaction block 
    # controlled by us unless we start one.
    
    if movement.quantity_change == 0:
        raise HTTPException(status_code=400, detail="Quantity change cannot be zero")

    # 1. Create the movement record
    db_movement = models.StockMovement(
        product_id=movement.product_id,
        warehouse_id=movement.warehouse_id,
        quantity_change=movement.quantity_change,
        movement_type=movement.movement_type,
        reference_id=movement.reference_id,
        user_id=user_id
    )
    db.add(db_movement)
    
    # 2. Lock and Update Stock Level
    stmt = select(models.StockLevel).where(
        models.StockLevel.product_id == movement.product_id,
        models.StockLevel.warehouse_id == movement.warehouse_id
    ).with_for_update()
    
    result = await db.execute(stmt)
    stock_level = result.scalar_one_or_none()
    
    if not stock_level:
        # Create new stock level entry if it doesn't exist
        # NOTE: Be careful with race conditions here if inserted concurrently; 
        # usually you'd want to upsert or ensure it exists.
        stock_level = models.StockLevel(
            product_id=movement.product_id, 
            warehouse_id=movement.warehouse_id, 
            quantity=0
        )
        db.add(stock_level)
    
    stock_level.quantity += movement.quantity_change
    
    # 3. Validation
    if stock_level.quantity < 0:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Current: {stock_level.quantity - movement.quantity_change}")
    
    await db.commit()
    await db.refresh(db_movement)
    return db_movement

async def get_stock_levels(db: AsyncSession, skip: int = 0, limit: int = 100):
    stmt = select(models.StockLevel).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
