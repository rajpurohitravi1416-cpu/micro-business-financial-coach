from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Sale, Purchase, Expense, Udhaar
from app.schemas.cashflow import CashFlowResponse

router = APIRouter(prefix="/cashflow", tags=["Cash Flow"])


@router.get(
    "/business/{business_id}",
    response_model=CashFlowResponse,
)
def get_cash_flow(
    business_id: int,
    db: Session = Depends(get_db),
):
    cash_sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.payment_mode.ilike("cash"),
        )
        .with_entities(Sale.total_amount)
        .all()
    )

    cash_sales_total = sum(
        amount for (amount,) in cash_sales
    )

    cash_purchases = (
        db.query(Purchase)
        .filter(
            Purchase.business_id == business_id,
            Purchase.payment_mode.ilike("cash"),
        )
        .with_entities(Purchase.total_amount)
        .all()
    )

    cash_purchases_total = sum(
        amount for (amount,) in cash_purchases
    )

    cash_expenses = (
        db.query(Expense)
        .filter(
            Expense.business_id == business_id,
            Expense.payment_mode.ilike("cash"),
        )
        .with_entities(Expense.amount)
        .all()
    )

    cash_expenses_total = sum(
        amount for (amount,) in cash_expenses
    )

    udhaar_records = (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .all()
    )

    udhaar_collected = sum(
        record.amount_paid for record in udhaar_records
    )

    outstanding_udhaar = sum(
        record.amount - record.amount_paid
        for record in udhaar_records
    )

    net_cash_flow = (
        cash_sales_total
        + udhaar_collected
        - cash_purchases_total
        - cash_expenses_total
    )

    return CashFlowResponse(
        business_id=business_id,
        cash_sales=cash_sales_total,
        udhaar_collected=udhaar_collected,
        cash_purchases=cash_purchases_total,
        cash_expenses=cash_expenses_total,
        net_cash_flow=net_cash_flow,
        outstanding_udhaar=outstanding_udhaar,
    )
