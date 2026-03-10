
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.app.database import engine, Base
from backend.app.routers import auth, inventory, suppliers, sales

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="Nexus ERP", 
    lifespan=lifespan,
    redirect_slashes=False # Prevents 307 Redirect errors
)

# Allow Frontend to talk to Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nexus-erp-1.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(suppliers.router)