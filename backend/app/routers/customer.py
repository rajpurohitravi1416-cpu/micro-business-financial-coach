from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business, Customer
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    business = (
        db.query(Business)
        .filter(Business.id == customer_data.business_id)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

    customer = Customer(
        business_id=customer_data.business_id,
        name=customer_data.name,
        phone=customer_data.phone,
        total_due=0,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get(
    "/business/{business_id}",
    response_model=list[CustomerResponse],
)
def get_customers(
    business_id: int,
    db: Session = Depends(get_db),
):
    return (
        db.query(Customer)
        .filter(Customer.business_id == business_id)
        .order_by(Customer.name.asc())
        .all()
    )
