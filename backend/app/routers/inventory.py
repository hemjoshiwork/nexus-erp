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
@router.post("/upload")
async def upload_inventory(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    import re
    import uuid
    from pydantic import ValidationError
    from ..schemas import ProductCreate, SupplierCreate

    try:
        if file.filename.endswith('.csv'): 
            df = pd.read_csv(file.file, dtype=str)
        else: 
            df = pd.read_excel(file.file, dtype=str)
            
        df.columns = [c.strip() for c in df.columns]

        if 'Supplier Phone' in df.columns:
            df['Supplier Phone'] = df['Supplier Phone'].astype(str).str.replace(r'\.0$', '', regex=True)
        if 'Phone' in df.columns:
            df['Phone'] = df['Phone'].astype(str).str.replace(r'\.0$', '', regex=True)
            
        df = df.where(pd.notnull(df), None)
    except Exception as e: 
        raise HTTPException(status_code=400, detail=f"Invalid file: {str(e)}")

    added = 0; updated = 0
    
    def get_col(row, *aliases):
        for alias in aliases:
            val = row.get(alias)
            if val is not None and str(val).strip().lower() != 'nan':
                return str(val).strip()
        return None

    email_pattern = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")

    for _, row in df.iterrows():
        # Handle Supplier
        sup_name = get_col(row, "Supplier", "Supplier Name")
        sup_id = None
        
        if sup_name:
            stmt = select(Supplier).where(Supplier.name == sup_name, Supplier.company_id == current_user.company_id)
            res = await db.execute(stmt)
            supplier_obj = res.scalar_one_or_none()
            
            if not supplier_obj:
                raw_email = get_col(row, "Supplier Email", "Email")
                valid_email = raw_email if raw_email and re.match(email_pattern, raw_email) else "pending@nexuserp.com"
                raw_phone = get_col(row, "Supplier Phone", "Phone")

                try:
                    sup_schema = SupplierCreate(
                        name=sup_name,
                        contact_person=get_col(row, "Supplier Contact", "Contact Person"),
                        email=valid_email,
                        phone_number=raw_phone if raw_phone and raw_phone.isdigit() and len(raw_phone)==10 else None
                    )
                except ValidationError:
                    sup_schema = SupplierCreate(
                        name=sup_name,
                        contact_person=get_col(row, "Supplier Contact", "Contact Person"),
                        email="pending@nexuserp.com",
                        phone_number=None
                    )

                supplier_obj = Supplier(
                    name=sup_schema.name,
                    contact_person=sup_schema.contact_person,
                    email=sup_schema.email,
                    phone_number=sup_schema.phone_number,
                    company_id=current_user.company_id
                )
                db.add(supplier_obj)
                await db.flush()
            sup_id = supplier_obj.id

        # Handle Product
        sku = get_col(row, "SKU", "sku")
        
        try: price = float(get_col(row, "Price", "Price (INR)") or 0)
        except: price = 0.0
            
        try: qty = int(float(get_col(row, "Quantity", "Stock", "Qty") or 0))
        except: qty = 0

        name = get_col(row, "Name", "Product Name")
        if not name:
            continue # Products must have a name
            
        category = get_col(row, "Category")

        try:
            prod_schema = ProductCreate(
                name=name,
                sku=sku,
                category=category or "General",
                price=price,
                quantity=qty,
                supplier_id=sup_id
            )
        except ValidationError:
            continue
            
        if not prod_schema.sku:
            prod_schema.sku = f'SKU-{str(uuid.uuid4())[:8].upper()}'
            
        res = await db.execute(select(Product).where(Product.sku == prod_schema.sku, Product.company_id == current_user.company_id))
        existing = res.scalar_one_or_none()
        
        if existing:
            existing.price = prod_schema.price
            existing.quantity = prod_schema.quantity
            existing.name = prod_schema.name
            existing.category = prod_schema.category
            if sup_id: existing.supplier_id = prod_schema.supplier_id
            updated += 1
        else:
            db.add(Product(
                name=prod_schema.name,
                sku=prod_schema.sku,
                category=prod_schema.category,
                price=prod_schema.price,
                quantity=prod_schema.quantity,
                supplier_id=prod_schema.supplier_id,
                company_id=current_user.company_id
            ))
            added += 1

    await db.commit()
    return {"message": "Success", "added": added, "updated": updated}