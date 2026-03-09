from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..database import get_db
from ..models import Supplier, User
from ..schemas import SupplierCreate, SupplierResponse
from ..routers.auth import get_current_user

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.post("", response_model=SupplierResponse)
async def create_supplier(supplier: SupplierCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if exists (per company)
    result = await db.execute(select(Supplier).filter(Supplier.name == supplier.name, Supplier.company_id == current_user.company_id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Supplier name already exists")

    new_supplier = Supplier(
        name=supplier.name,
        contact_person=supplier.contact_person,
        email=supplier.email,
        phone_number=supplier.phone_number,
        company_id=current_user.company_id
    )
    db.add(new_supplier)
    await db.commit()
    await db.refresh(new_supplier)
    return new_supplier

@router.get("", response_model=List[SupplierResponse])
async def read_suppliers(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Supplier).where(Supplier.company_id == current_user.company_id))
    return result.scalars().all()

@router.delete("/{supplier_id}")
async def delete_supplier(supplier_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id, Supplier.company_id == current_user.company_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    await db.delete(supplier)
    await db.commit()
    return {"message": "Supplier deleted successfully"}

from fastapi import Request

@router.put('/{supplier_id}')
async def update_supplier(supplier_id: int, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import select
    data = await request.json()

    stmt = select(Supplier).where(Supplier.id == supplier_id, Supplier.company_id == current_user.company_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if not existing:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    # Dynamically update only the fields sent from the frontend
    if 'name' in data: existing.name = data['name']
    if 'contact_person' in data: existing.contact_person = data['contact_person']
    if 'email' in data: existing.email = data['email']
    if 'phone' in data: existing.phone_number = data['phone'] # Mapped to phone_number to align with model
    if 'status' in data: existing.status = data['status']

    await db.commit()
    return {'message': 'Supplier updated successfully'}