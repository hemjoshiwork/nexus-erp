
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
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

# The Ultimate Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global Exception Handler (The CORS Safety Net)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log the real error to the terminal
    print(f"CRITICAL SERVER ERROR: {exc}") 
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error_message": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"} # Prevents Fake CORS errors
    )

app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(suppliers.router)