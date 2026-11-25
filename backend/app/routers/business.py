from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Business
from app.schemas.business import BusinessCreate, BusinessResponse
from app.models import User

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.post("/", response_model=BusinessResponse)
def create_business(
    business_data: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = Business(
        name=business_data.name,
        owner_name=business_data.owner_name,
        phone=business_data.phone,
        opening_cash=business_data.opening_cash,
        owner_user_id=current_user.id,
    )

    db.add(business)
    db.commit()
    db.refresh(business)

    return business


@router.get("/mine", response_model=list[BusinessResponse])
def get_my_businesses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        return db.query(Business).order_by(Business.id.asc()).all()
    return (
        db.query(Business)
        .filter(Business.owner_user_id == current_user.id)
        .order_by(Business.id.asc())
        .all()
    )


@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return require_business_access(db, current_user, business_id)


@router.patch("/{business_id}/opening-cash", response_model=BusinessResponse)
def update_opening_cash(
    business_id: int,
    opening_cash: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = require_business_access(db, current_user, business_id)

    if opening_cash < 0:
        raise HTTPException(
            status_code=400,
            detail="Opening cash cannot be negative",
        )

    business.opening_cash = opening_cash

    db.commit()
    db.refresh(business)

    return business
