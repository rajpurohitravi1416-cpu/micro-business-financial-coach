from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Sale, Purchase, Expense, Udhaar, User


router = APIRouter(
    prefix="/safe-to-spend",
    tags=["Safe to Spend"],
)


@router.get("/{business_id}")
def get_safe_to_spend(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business_access(db, current_user, business_id)

    cash_sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.payment_mode == "cash",
        )
        .all()
    )

    cash_purchases = (
        db.query(Purchase)
        .filter(
            Purchase.business_id == business_id,
            Purchase.payment_mode == "cash",
        )
        .all()
    )

    cash_expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
            Expense.payment_mode == "cash",
        )
        .all()
    )

    total_cash_sales = sum(
        sale.total_amount for sale in cash_sales
    )

    total_cash_purchases = sum(
        purchase.total_amount for purchase in cash_purchases
    )

    total_cash_expenses = sum(
        expense.amount for expense in cash_expenses
    )

    udhaar_collected = (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .all()
    )

    total_udhaar_collected = sum(
        udhaar.amount_paid for udhaar in udhaar_collected
    )

    current_cash = (
        business.opening_cash
        + total_cash_sales
        + total_udhaar_collected
        - total_cash_purchases
        - total_cash_expenses
    )

    outstanding_udhaar = sum(
        max(udhaar.amount - udhaar.amount_paid, 0)
        for udhaar in udhaar_collected
    )

    reserve = outstanding_udhaar

    safe_to_spend = max(current_cash - reserve, 0)

    return {
        "business_id": business_id,
        "opening_cash": business.opening_cash,
        "cash_sales": total_cash_sales,
        "udhaar_collected": total_udhaar_collected,
        "cash_purchases": total_cash_purchases,
        "cash_expenses": total_cash_expenses,
        "current_cash": current_cash,
        "cash_reserve": reserve,
        "safe_to_spend": safe_to_spend,
    }
