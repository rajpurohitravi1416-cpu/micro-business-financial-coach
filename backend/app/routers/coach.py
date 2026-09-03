from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Product, Sale, Expense, Udhaar

router = APIRouter(prefix="/coach", tags=["Coach"])


@router.get("/business/{business_id}")
def get_business_coach(
    business_id: int,
    db: Session = Depends(get_db),
):
    sales = (
        db.query(Sale)
        .filter(Sale.business_id == business_id)
        .all()
    )

    expenses = (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .all()
    )

    udhaar_records = (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .all()
    )

    products = (
        db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    )

    total_sales = sum(sale.total_amount for sale in sales)
    total_profit = sum(sale.profit for sale in sales)
    total_expenses = sum(expense.amount for expense in expenses)

    net_profit = total_profit - total_expenses

    outstanding_udhaar = sum(
        max(udhaar.amount - udhaar.amount_paid, 0)
        for udhaar in udhaar_records
    )

    low_stock_products = [
        {
            "id": product.id,
            "name": product.name,
            "stock_quantity": product.stock_quantity,
            "minimum_stock": product.minimum_stock,
        }
        for product in products
        if product.stock_quantity <= product.minimum_stock
    ]

    insights = []

    # Profit insight
    if net_profit < 0:
        insights.append(
            "Your business is currently running at a loss. "
            "Review expenses and improve profit margins."
        )
    elif net_profit == 0:
        insights.append(
            "Your business is currently breaking even. "
            "Focus on increasing margins and controlling expenses."
        )
    else:
        insights.append(
            "Your business is profitable. "
            "Continue monitoring expenses and margins."
        )

    # Expense insight
    if total_sales > 0 and total_expenses > total_sales:
        insights.append(
            "Your expenses are higher than your sales revenue. "
            "Identify and reduce unnecessary expenses."
        )

    # Udhaar insight
    if outstanding_udhaar > 0:
        insights.append(
            f"You have ₹{outstanding_udhaar:.0f} in outstanding Udhaar. "
            "Follow up with customers to improve cash flow."
        )

    # Low stock insight
    if low_stock_products:
        insights.append(
            f"{len(low_stock_products)} product(s) are at or below "
            "their minimum stock level. Consider restocking."
        )
    else:
        insights.append(
            "Your current inventory has no products below the "
            "minimum stock level."
        )

    # Sales insight
    if total_sales == 0:
        insights.append(
            "No sales have been recorded yet."
        )
    elif total_profit / total_sales < 0.10:
        insights.append(
            "Your current profit margin is below 10%. "
            "Review product pricing and purchase costs."
        )
    else:
        insights.append(
            "Your current sales are generating a reasonable "
            "gross profit margin."
        )

    return {
        "business_id": business_id,
        "summary": {
            "total_sales": total_sales,
            "total_profit": total_profit,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "outstanding_udhaar": outstanding_udhaar,
        },
        "insights": insights,
        "low_stock_products": low_stock_products,
    }
