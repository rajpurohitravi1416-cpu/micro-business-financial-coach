from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business
from app.schemas.business import BusinessCreate, BusinessResponse

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.post("/", response_model=BusinessResponse)
def create_business(
    business_data: BusinessCreate,
    db: Session = Depends(get_db),
):
    business = Business(
        name=business_data.name,
        owner_name=business_data.owner_name,
        phone=business_data.phone,
        opening_cash=business_data.opening_cash,
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
):
    return db.get(Business, business_id)


@router.patch("/{business_id}/opening-cash", response_model=BusinessResponse)
def update_opening_cash(
    business_id: int,
    opening_cash: float,
    db: Session = Depends(get_db),
):
    business = db.get(Business, business_id)

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

    if opening_cash < 0:
        raise HTTPException(
            status_code=400,
            detail="Opening cash cannot be negative",
        )

    business.opening_cash = opening_cash

    db.commit()
    db.refresh(business)

    return business
