import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.db.migrations import backup_database_if_needed, ensure_auth_schema
from app.models import (
    Business,
    Product,
    Sale,
    Purchase,
    Expense,
    Customer,
    Udhaar,
    User,
    UserSession,
)
from app.routers import (
    business,
    product,
    sales,
    expense,
    purchase,
    customer,
    udhaar,
    analytics,
    coach,
    cashflow,
    safe_to_spend,
    auth,
    admin,
)

backup_database_if_needed()
Base.metadata.create_all(bind=engine)
ensure_auth_schema()

app = FastAPI(
    title="MysHopUpdates API",
    description="Small-business management API for sales, inventory, expenses, customer credit, and cash flow.",
    version="0.1.0",
)

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(business.router)
app.include_router(product.router)
app.include_router(sales.router)
app.include_router(expense.router)
app.include_router(purchase.router)
app.include_router(customer.router)
app.include_router(udhaar.router)
app.include_router(analytics.router)
app.include_router(coach.router)
app.include_router(cashflow.router)
app.include_router(safe_to_spend.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "MysHopUpdates API is running",
        "status": "healthy",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "MysHopUpdates-backend",
    }

