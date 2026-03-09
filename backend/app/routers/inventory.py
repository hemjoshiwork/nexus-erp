from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List
import pandas as pd
from io import BytesIO
from ..database import get_db
from ..models import Product, StockMovement, Supplier, User
from ..schemas import ProductCreate, ProductResponse, StockMovementCreate
from ..routers.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])

def clean_str(val):
    if pd.isna(val) or val is None: return ""
    s = str(val).strip()
    return "" if s.lower() == "nan" else s

def get_tax_rate(category: str) -> float:
    if not category: return 18.0
    cat = category.lower().strip()
    if cat == 'essential': return 0.0
    if cat == 'mass consumption': return 5.0
    if cat == 'standard-low': return 12.0
    if cat in ['general', 'electronics']: return 18.0
    if cat == 'luxury': return 28.0
    return 18.0

# --- 1. PRODUCT CRUD ---
@router.post("", response_model=ProductResponse)
async def create_product_root(product: ProductCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    import uuid
    # Auto-generate SKU if not provided
    final_sku = product.sku
    if not final_sku:
        final_sku = f"SKU-{str(uuid.uuid4())[:8].upper()}"

    # 1. Create the product
    new_product = Product(
        name=product.name,
        sku=final_sku,
        category=product.category,
        price=product.price,
        quantity=product.quantity,

        description=product.description,
        tax_category=product.tax_category,
        tax_rate=get_tax_rate(product.tax_category),
        supplier_id=product.supplier_id,
        company_id=current_user.company_id
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product) # Get the ID
    
    # 2. FIX: Explicitly load the Supplier relationship to prevent "MissingGreenlet" error
    stmt = select(Product).options(selectinload(Product.supplier)).where(Product.id == new_product.id)
    result = await db.execute(stmt)
    final_product = result.scalar_one()
    
    return final_product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product: ProductCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Product).where(Product.id == product_id, Product.company_id == current_user.company_id)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if not existing: raise HTTPException(status_code=404, detail="Product not found")
    
    existing.name = product.name
    existing.sku = product.sku
    existing.category = product.category
    existing.price = product.price
    existing.quantity = product.quantity
    existing.description = product.description
    existing.tax_category = product.tax_category
    existing.tax_rate = get_tax_rate(product.tax_category)
    existing.supplier_id = product.supplier_id
    
    await db.commit()
    
    # FIX: Re-fetch with Supplier loaded
    stmt = select(Product).options(selectinload(Product.supplier)).where(Product.id == product_id)
    result = await db.execute(stmt)
    final_product = result.scalar_one()
    
    return final_product

@router.get("/products", response_model=List[ProductResponse])
async def read_products(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Product).where(Product.company_id == current_user.company_id).options(selectinload(Product.supplier))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/clear")
async def clear_inventory(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await db.execute(delete(StockMovement).where(StockMovement.company_id == current_user.company_id))
    await db.execute(delete(Product).where(Product.company_id == current_user.company_id))
    await db.commit()
    return {"message": "Inventory cleared"}

# --- 2. STOCK MOVEMENTS ---
@router.post("/movements")
async def create_movement(movement: StockMovementCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Product).where(Product.id == movement.product_id, Product.company_id == current_user.company_id))
    product = result.scalar_one_or_none()
    if not product: raise HTTPException(status_code=404, detail="Product not found")

    if movement.movement_type.lower() == "in":
        product.quantity += movement.change_amount
    elif movement.movement_type.lower() == "out":
        if product.quantity < movement.change_amount: raise HTTPException(status_code=400, detail="Not enough stock")
        product.quantity -= movement.change_amount
    
    db.add(StockMovement(
        product_id=movement.product_id, 
        change_amount=movement.change_amount, 
        movement_type=movement.movement_type, 
        reason=movement.reason, 
        user_id=current_user.id,
        company_id=current_user.company_id
    ))
    await db.commit()
    return {"message": "Stock updated"}

# --- 3. SMART UPLOAD ---
@router.post('/upload')
async def upload_inventory(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import insert
    import uuid
    try:
        # Read file (CSV or Excel)
        df = pd.read_csv(file.file) if file.filename.endswith('.csv') else pd.read_excel(file.file)
        
        # 1. Standardize Headers (Lowercase, no spaces, no 'product_')
        df.columns = [c.strip().lower().replace(' ', '_').replace('product_', '') for c in df.columns]
        
        # 2. Map Common Header Mismatches (Fixes 'Stock Quantity' and others)
        header_map = {'stock_quantity': 'quantity', 'stock': 'quantity', 'item_name': 'name'}
        df.rename(columns={k: v for k, v in header_map.items() if k in df.columns}, inplace=True)
        
        # 3. Clean Numeric Data (Remove $ or commas, fill empty with 0)
        for col in ['price', 'quantity']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
                
        # 4. Handle Tax and Metadata
        if 'tax_category' not in df.columns: 
            df['tax_category'] = 'general'
        
        # Apply the tax calculator function to every row
        df['tax_rate'] = df['tax_category'].apply(lambda x: get_tax_rate(str(x)))
        df['company_id'] = current_user.company_id
        
        if 'sku' not in df.columns:
            df['sku'] = [f'SKU-{str(uuid.uuid4())[:8].upper()}' for _ in range(len(df))]
            
        # 5. Final NaN cleanup for text fields
        df.fillna('', inplace=True)
        
        # 6. High-Speed Bulk Insert
        await db.execute(insert(Product).values(df.to_dict('records')))
        await db.commit()
        
        return {'message': 'Success', 'added': len(df)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Upload Error: {str(e)}')