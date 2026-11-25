from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Customer, User
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, customer_data.business_id)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Customer)
        .filter(Customer.business_id == business_id)
        .order_by(Customer.name.asc())
        .all()
    )
