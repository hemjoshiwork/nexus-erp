from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from ..database import get_db
from ..models import Product, Sale, SaleItem, User
from ..schemas import SaleCreate, SaleResponse
from ..routers.auth import get_current_user
import datetime

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("", response_model=SaleResponse)
async def create_sale(sale_data: SaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.date.today()
    result = await db.execute(select(func.count(Sale.id)))
    count = result.scalar()
    invoice_no = f"INV-{today.year}-{count + 1:04d}"

    total_amount = 0.0
    tax_amount = 0.0
    sale_items = []

    for item in sale_data.items:
        res = await db.execute(select(Product).where(Product.id == item.product_id, Product.company_id == current_user.company_id))
        product = res.scalar_one_or_none()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Low stock for {product.name}")

        item_total = product.price * item.quantity
        item_tax = item_total * (product.tax_rate / 100)
        product.quantity -= item.quantity
        
        sale_item = SaleItem(
            product_id=product.id,
            product_name=product.name,
            quantity=item.quantity,
            unit_price=product.price,
            tax_rate=product.tax_rate,
            total=item_total + item_tax
        )
        sale_items.append(sale_item)
        total_amount += (item_total + item_tax)
        tax_amount += item_tax

    new_sale = Sale(
        invoice_number=invoice_no,
        customer_name=sale_data.customer_name,
        customer_phone_number=sale_data.customer_phone_number,
        customer_gstin=sale_data.customer_gstin,
        total_amount=total_amount,
        tax_amount=tax_amount,
        payment_mode=sale_data.payment_mode,
        items=sale_items,
        company_id=current_user.company_id
    )
    
    db.add(new_sale)
    await db.commit()
    await db.refresh(new_sale)
    
    stmt = select(Sale).options(selectinload(Sale.items)).where(Sale.id == new_sale.id)
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/history", response_model=List[SaleResponse])
async def get_sales_history(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Sale).where(Sale.company_id == current_user.company_id).options(selectinload(Sale.items)).order_by(Sale.timestamp.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
