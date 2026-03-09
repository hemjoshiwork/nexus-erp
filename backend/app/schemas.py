from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# --- AUTH ---
class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: Optional[str] = None
    company_id: Optional[int] = None
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    company_name: str

# --- SUPPLIER ---
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            if not v.isdigit() or len(v) != 10:
                raise ValueError('Phone number must be exactly 10 digits and numbers only')
        return v

class SupplierCreate(SupplierBase):
    pass
class SupplierResponse(SupplierBase):
    id: int
    company_id: int
    class Config: from_attributes = True

# --- PRODUCT ---
class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = None
    category: Optional[str] = "General"
    price: Optional[float] = 0.0
    quantity: Optional[int] = 0
    description: Optional[str] = None
    
    # NEW GST Fields
    hsn_code: Optional[str] = None
    tax_rate: Optional[float] = 18.0
    tax_category: Optional[str] = "General"
    
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass
class ProductResponse(ProductBase):
    id: int
    company_id: int
    supplier: Optional[SupplierResponse] = None
    class Config: from_attributes = True

# --- STOCK ---
class StockMovementCreate(BaseModel):
    product_id: int
    change_amount: int
    movement_type: str
    reason: Optional[str] = None

# --- SALES (NEW) ---
class SaleItemSchema(BaseModel):
    product_id: int
    quantity: int

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class SaleCreate(BaseModel):
    customer_name: str
    customer_phone_number: Optional[str] = None
    customer_gstin: Optional[str] = None
    
    @field_validator('customer_phone_number')
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            if not v.isdigit() or len(v) != 10:
                raise ValueError('Phone number must be exactly 10 digits and numbers only')
        return v
    payment_mode: Optional[str] = "Cash"
    items: List[SaleItemSchema]

class SaleItemResponse(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    total: float
    tax_rate: float
    class Config: from_attributes = True

class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    total_amount: float
    tax_amount: float
    timestamp: datetime
    company_id: int
    items: List[SaleItemResponse]
    class Config: from_attributes = True