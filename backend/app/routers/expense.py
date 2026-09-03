from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business, Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
):
    business = (
        db.query(Business)
        .filter(Business.id == expense_data.business_id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

    if expense_data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Expense amount must be greater than zero",
        )

    expense = Expense(
        business_id=expense_data.business_id,
        category=expense_data.category,
        description=expense_data.description,
        amount=expense_data.amount,
        payment_mode=expense_data.payment_mode
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@router.get(
    "/business/{business_id}",
    response_model=list[ExpenseResponse],
)
def get_expenses(
    business_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .order_by(Expense.created_at.desc())
        .all()
    )
