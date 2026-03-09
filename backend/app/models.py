from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="company", lazy="noload")
    products = relationship("Product", back_populates="company", lazy="noload")
    sales = relationship("Sale", back_populates="company", lazy="noload")
    suppliers = relationship("Supplier", back_populates="company", lazy="noload")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="staff")
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="users", lazy="noload")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    # NEW: GST Info
    gstin = Column(String, nullable=True)
    address = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="suppliers", lazy="noload")
    
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True, index=True)
    category = Column(String, index=True)
    price = Column(Float, default=0.0)
    quantity = Column(Integer, default=0)
    description = Column(String, nullable=True)
    
    # NEW: GST Fields
    hsn_code = Column(String, nullable=True) 
    tax_rate = Column(Float, default=18.0) # Default 18% GST
    tax_category = Column(String, default="General") # Essential, Standard, Luxury etc.
    
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="products")
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", back_populates="products", lazy="noload")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    change_amount = Column(Integer)
    movement_type = Column(String)
    reason = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

# NEW: Sales Ledger (The Invoice Header)
class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    customer_name = Column(String)
    customer_gstin = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    
    total_amount = Column(Float)
    tax_amount = Column(Float)
    payment_mode = Column(String, default="Cash") # Cash/UPI/Card
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    items = relationship("SaleItem", back_populates="sale")
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    company = relationship("Company", back_populates="sales", lazy="noload")

# NEW: Items inside a Bill
class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    product_name = Column(String) # Snapshot of name
    quantity = Column(Integer)
    unit_price = Column(Float)
    tax_rate = Column(Float)
    total = Column(Float)
    
    sale = relationship("Sale", back_populates="items")