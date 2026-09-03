from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.models import (
    Business,
    Product,
    Sale,
    Purchase,
    Expense,
    Customer,
    Udhaar,
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
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bizz Brains API",
    description="AI-powered financial coach for Indian micro-businesses",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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


@app.get("/")
def root():
    return {
        "message": "Bizz Brains API is running",
        "status": "healthy",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "bizz-brains-backend",
    }

