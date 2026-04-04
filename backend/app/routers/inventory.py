from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload, joinedload
from typing import List
import pandas as pd
from io import BytesIO
from ..database import get_db
from ..models import Product, StockMovement, Supplier, User, SaleItem
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
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Product SKU already exists or database integrity violation")
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
async def get_products(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 100):
    try:
        # Use joinedload to fetch the related supplier in a single 'JOIN' query
        stmt = (
            select(Product)
            .where(Product.company_id == current_user.company_id)
            .options(joinedload(Product.supplier))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        print(f"Database Error: {e}")
        return []

@router.options("/clear")
async def preflight_clear(request: Request):
    return Response(status_code=200)

@router.delete("/clear")
async def clear_inventory(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # 1. Delete dependent Stock Movements (Inventory history is safe to clear)
        await db.execute(delete(StockMovement).where(StockMovement.company_id == current_user.company_id))
        
        # 2. PRESERVE SALES: Unlink products from sale items via subquery
        # Get all product IDs for this company
        company_product_ids_query = select(Product.id).where(Product.company_id == current_user.company_id)
        
        # Update only SaleItems attached to those specific products
        await db.execute(
            update(SaleItem)
            .where(SaleItem.product_id.in_(company_product_ids_query))
            .values(product_id=None)
        )
        
        # 3. Now it is safe to delete the Products
        await db.execute(delete(Product).where(Product.company_id == current_user.company_id))
        
        # 4. Delete the Suppliers as requested
        await db.execute(delete(Supplier).where(Supplier.company_id == current_user.company_id))
        
        await db.commit()
        return {"message": "Inventory and suppliers purged. Sales history safely preserved!"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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
@router.options("/upload")
async def preflight_upload(request: Request):
    return Response(status_code=200)

@router.post('/upload')
async def upload_inventory(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import insert, select
    from sqlalchemy.exc import IntegrityError
    import uuid
    import pandas as pd
    try:
        df = pd.read_csv(file.file) if file.filename.endswith('.csv') else pd.read_excel(file.file)
        df.columns = [str(c).strip().lower().replace(' ', '_').replace('product_', '') for c in df.columns]
        df.rename(columns={'stock_quantity': 'quantity', 'stock': 'quantity'}, inplace=True)
        
        company_id = current_user.company_id
        
        # 1. Bulletproof Default Supplier
        stmt = select(Supplier).where(Supplier.name == f"Default Bulk {company_id}", Supplier.company_id == company_id)
        def_sup = (await db.execute(stmt)).scalar_one_or_none()
        if not def_sup:
            try:
                def_sup = Supplier(name=f"Default Bulk {company_id}", contact_person="Admin", email=f"bulk_{company_id}@example.com", phone_number="0000000000", company_id=company_id)
                db.add(def_sup)
                await db.commit()
                await db.refresh(def_sup)
            except IntegrityError:
                await db.rollback() # CRITICAL: Releases the locked database state
                def_sup = Supplier(name=f"Default Bulk {company_id}_{uuid.uuid4().hex[:4]}", contact_person="Admin", email=f"bulk_{company_id}_{uuid.uuid4().hex[:4]}@example.com", phone_number="0000000000", company_id=company_id)
                db.add(def_sup)
                await db.commit()
                await db.refresh(def_sup)
                
        # 2. Build Supplier Map with Failsafes
        supplier_map = {}
        if 'supplier_name' in df.columns:
            unique_sups = df[['supplier_name', 'supplier_email', 'supplier_phone'] if 'supplier_email' in df.columns else ['supplier_name']].drop_duplicates()
            for _, row in unique_sups.iterrows():
                s_name = str(row.get('supplier_name', '')).strip()
                if not s_name or s_name.lower() == 'nan': continue
                
                raw_email = str(row.get('supplier_email', f"contact@{s_name.replace(' ', '').lower()[:10]}.com")).strip()
                if raw_email.lower() == 'nan': raw_email = f"contact_{uuid.uuid4().hex[:6]}@example.com"
                s_phone = str(row.get('supplier_phone', '0000000000')).strip()
                
                # Bypasses ALL global database unique constraints by injecting the Tenant ID
                safe_email = f"{company_id}_{raw_email}"
                safe_name = f"{s_name} (CID:{company_id})" 
                cache_key = f"{s_name}_{raw_email}" # Cache by ORIGINAL excel values
                
                if cache_key in supplier_map: continue
                
                stmt = select(Supplier).where(Supplier.name == safe_name, Supplier.company_id == company_id)
                sup = (await db.execute(stmt)).scalar_one_or_none()
                
                if not sup:
                    try:
                        sup = Supplier(name=safe_name, contact_person=s_name, email=safe_email, phone_number=s_phone, company_id=company_id)
                        db.add(sup)
                        await db.commit()
                        await db.refresh(sup)
                    except IntegrityError:
                        await db.rollback() # CRITICAL: Catch collisions
                        sup = Supplier(name=f"{safe_name} {uuid.uuid4().hex[:4]}", contact_person=s_name, email=f"{uuid.uuid4().hex[:8]}@example.com", phone_number=s_phone, company_id=company_id)
                        db.add(sup)
                        await db.commit()
                        await db.refresh(sup)
                        
                supplier_map[cache_key] = sup.id
                
        # 3. Native Record Processing
        records = []
        for _, row in df.iterrows():
            s_name = str(row.get('supplier_name', '')).strip()
            raw_email = str(row.get('supplier_email', f"contact@{s_name.replace(' ', '').lower()[:10]}.com")).strip()
            if raw_email.lower() == 'nan': raw_email = f"contact_{uuid.uuid4().hex[:6]}@example.com"
            
            cache_key = f"{s_name}_{raw_email}"
            final_sup_id = supplier_map.get(cache_key, def_sup.id)
            
            sku_val = str(row.get('sku', '')).strip()
            if not sku_val or sku_val.lower() == 'nan': sku_val = f"SKU-{str(uuid.uuid4())[:8].upper()}"
                
            tax_cat = str(row.get('tax_category', 'general')).strip()
            if not tax_cat or tax_cat.lower() == 'nan': tax_cat = 'general'
            
            try: price_val = float(row.get('price', 0.0))
            except: price_val = 0.0
            if pd.isna(price_val): price_val = 0.0
            
            try: qty_val = int(row.get('quantity', 0))
            except: qty_val = 0
            if pd.isna(qty_val): qty_val = 0
            
            records.append({
                'name': str(row.get('name', 'Unnamed Product')).strip(),
                'sku': sku_val,
                'category': str(row.get('category', 'General')).strip(),
                'price': price_val,
                'quantity': qty_val,
                'description': str(row.get('description', '')).strip(),
                'tax_category': tax_cat,
                'tax_rate': get_tax_rate(tax_cat),
                'supplier_id': int(final_sup_id),
                'company_id': company_id
            })
        
        # 4. Chunked Insertion
        chunk_size = 1000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            await db.execute(insert(Product).values(chunk))
            
        await db.commit()
        return {'message': 'Success', 'added': len(records)}
        
    except Exception as e:
        await db.rollback() # CRITICAL: Never leave the DB in a locked state
        import traceback
        print("UPLOAD CRASH:", traceback.format_exc())
        raise HTTPException(status_code=400, detail=f'Upload Error: {str(e)}')