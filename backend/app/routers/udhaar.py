from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Customer, Udhaar, User
from app.schemas.udhaar import (
    UdhaarCreate,
    UdhaarPayment,
    UdhaarResponse,
)

router = APIRouter(prefix="/udhaar", tags=["Udhaar"])


@router.post("/", response_model=UdhaarResponse)
def create_udhaar(
    udhaar_data: UdhaarCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, udhaar_data.business_id)
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == udhaar_data.customer_id,
            Customer.business_id == udhaar_data.business_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    if udhaar_data.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Amount must be greater than zero",
        )

    udhaar = Udhaar(
        business_id=udhaar_data.business_id,
        customer_id=udhaar_data.customer_id,
        amount=udhaar_data.amount,
        amount_paid=0,
        status="pending",
        due_date=udhaar_data.due_date,
    )

    customer.total_due += udhaar_data.amount

    db.add(udhaar)
    db.commit()
    db.refresh(udhaar)

    return udhaar


@router.get(
    "/business/{business_id}",
    response_model=list[UdhaarResponse],
)
def get_udhaar(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Udhaar)
        .filter(Udhaar.business_id == business_id)
        .order_by(Udhaar.created_at.desc())
        .all()
    )


@router.post(
    "/{udhaar_id}/payment",
    response_model=UdhaarResponse,
)
def record_payment(
    udhaar_id: int,
    payment_data: UdhaarPayment,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    udhaar = (
        db.query(Udhaar)
        .filter(Udhaar.id == udhaar_id)
        .first()
    )

    if not udhaar:
        raise HTTPException(
            status_code=404,
            detail="Udhaar record not found",
        )

    require_business_access(db, current_user, udhaar.business_id)

    if payment_data.amount_paid <= 0:
        raise HTTPException(
            status_code=400,
            detail="Payment must be greater than zero",
        )

    remaining = udhaar.amount - udhaar.amount_paid

    if payment_data.amount_paid > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Payment exceeds remaining due: {remaining}",
        )

    customer = (
        db.query(Customer)
        .filter(Customer.id == udhaar.customer_id)
        .first()
    )

    udhaar.amount_paid += payment_data.amount_paid

    if customer:
        customer.total_due -= payment_data.amount_paid

        if customer.total_due < 0:
            customer.total_due = 0

    if udhaar.amount_paid >= udhaar.amount:
        udhaar.status = "paid"
    else:
        udhaar.status = "partial"

    db.commit()
    db.refresh(udhaar)

    return udhaar
