from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from ..database import get_db
from ..models import User, Company
from ..schemas import Token, UserSignup, ForgotPasswordRequest, ResetPasswordRequest
import random

router = APIRouter(tags=["auth"])

import os
import smtplib
from email.message import EmailMessage
import asyncio
from fastapi import BackgroundTasks
from ..config import settings

async def send_welcome_email(email: str, company_name: str):
    smtp_email = settings.smtp_email
    smtp_password = settings.smtp_password
    if not smtp_email or not smtp_password:
        print("SMTP credentials not configured. Skipping welcome email.")
        return

    msg = EmailMessage()
    msg.set_content(f"Welcome to Nexus ERP, {company_name}!\n\nWe are excited to have you on board. Start managing your business today.")
    msg['Subject'] = 'Welcome to Nexus ERP'
    msg['From'] = smtp_email
    msg['To'] = email

    def _send():
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"Welcome email sent to {email}")
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            
    await asyncio.to_thread(_send)
# --- SECURITY CONFIG ---
SECRET_KEY = "mysecretkey" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        company_id: int = payload.get("company_id")
        if email is None or company_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Check User in DB
    result = await db.execute(select(User).options(selectinload(User.company)).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if user is None or user.company_id != company_id:
        raise credentials_exception
    return user

# --- SIGN UP ENDPOINT ---
@router.post("/signup", response_model=Token)
async def signup(user_data: UserSignup, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # 1. Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # 2. Create Company
    new_company = Company(name=user_data.company_name)
    db.add(new_company)
    await db.commit()
    await db.refresh(new_company)
    
    # 3. Create User
    hashed_pwd = pwd_context.hash(user_data.password)
    new_user = User(
        email=user_data.email, 
        password_hash=hashed_pwd,
        company_id=new_company.id,
        role="admin"  # First user gets admin
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Trigger Welcome Email
    background_tasks.add_task(send_welcome_email, new_user.email, new_company.name)
    
    # 4. Generate Token (Auto Login)
    access_token = create_access_token(data={"sub": new_user.email, "company_id": new_company.id})
    return {"access_token": access_token, "token_type": "bearer"}

# --- LOGIN ENDPOINT ---
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Find user by email
    result = await db.execute(select(User).options(selectinload(User.company)).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    # Verify password (using correct column name: password_hash)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate Token
    access_token = create_access_token(data={"sub": user.email, "company_id": user.company_id})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PASSWORD RESET ---
def send_otp_email(email: str, otp: str):
    smtp_email = settings.mail_username
    smtp_password = settings.mail_password_reset
    if not smtp_email or not smtp_password:
        print("SMTP credentials not configured. Skipping OTP email.")
        return

    msg = EmailMessage()
    msg.set_content(f"Your Nexus ERP security code is: {otp}. This expires in 5 minutes.")
    msg['Subject'] = 'Nexus ERP Security Code'
    msg['From'] = settings.mail_from
    msg['To'] = email

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"OTP email sent to {email}")
    except Exception as e:
        print(f"Failed to send OTP email: {e}")

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
        
    otp = str(random.randint(100000, 999999))
    user.reset_otp = otp
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    await db.commit()
    
    background_tasks.add_task(send_otp_email, user.email, otp)
    return {"message": "OTP sent to your email address"}

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
        
    if user.reset_otp != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if not user.otp_expiry or datetime.utcnow() > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Update password
    user.password_hash = pwd_context.hash(req.new_password)
    user.reset_otp = None
    user.otp_expiry = None
    
    await db.commit()
    return {"message": "Password updated successfully"}