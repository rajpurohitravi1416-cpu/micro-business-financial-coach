from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Expense, User
from app.schemas.expense import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, expense_data.business_id)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Expense)
        .filter(Expense.business_id == business_id)
        .order_by(Expense.created_at.desc())
        .all()
    )
