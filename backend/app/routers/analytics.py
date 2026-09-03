from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Product, Sale, Purchase, Expense, Udhaar

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/business/{business_id}")
def get_business_analytics(
    business_id: int,
    db: Session = Depends(get_db),
):
    # Total sales revenue
    total_sales = (
        db.query(Sale)
        .filter(Sale.business_id == business_id)
        .all()
    )

    sales_revenue = sum(
        sale.total_amount for sale in total_sales
    )

    # Total profit from sales
    total_profit = sum(
        sale.profit for sale in total_sales
    )

    # Total purchases
    purchases = (
        db.query(Purchase)
        .filter(Purchase.business_id == business_id)
        .all()
    )

    total_purchases = sum(
        purchase.total_amount for purchase in purchases
    )

    # Total expenses
    expenses = (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .all()
    )

    total_expenses = sum(
        expense.amount for expense in expenses
    )

    # Net profit after expenses
    net_profit = total_profit - total_expenses

    # Outstanding Udhaar
    udhaar_records = (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .all()
    )

    outstanding_udhaar = sum(
        max(udhaar.amount - udhaar.amount_paid, 0)
        for udhaar in udhaar_records
    )

    # Current inventory value at purchase cost
    products = (
        db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    )

    inventory_value = sum(
        product.purchase_price * product.stock_quantity
        for product in products
    )

    # Low-stock products
    low_stock_products = sum(
        1
        for product in products
        if product.stock_quantity <= product.minimum_stock
    )

    return {
        "business_id": business_id,
        "total_sales": sales_revenue,
        "total_profit": total_profit,
        "total_purchases": total_purchases,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "outstanding_udhaar": outstanding_udhaar,
        "inventory_value": inventory_value,
        "low_stock_products": low_stock_products,
    }
