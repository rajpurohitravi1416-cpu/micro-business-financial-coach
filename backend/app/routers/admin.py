from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.database import get_db
from app.models import Business, User

router = APIRouter(prefix="/admin", tags=["Admin"])


class AssignOwnerRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)


@router.get("/overview")
def get_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "admin")
    users = (
        db.query(User)
        .filter(User.role == "shop_owner")
        .order_by(User.name.asc())
        .all()
    )
    unassigned = (
        db.query(Business)
        .filter(Business.owner_user_id.is_(None))
        .order_by(Business.id.asc())
        .all()
    )
    return {
        "user_count": db.query(User).count(),
        "shop_count": db.query(Business).count(),
        "users": [{"id": item.id, "name": item.name, "email": item.email} for item in users],
        "unassigned_businesses": [
            {"id": item.id, "name": item.name, "owner_name": item.owner_name}
            for item in unassigned
        ],
    }


@router.post("/businesses/{business_id}/assign-owner")
def assign_owner(
    business_id: int,
    data: AssignOwnerRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_role(user, "admin")
    business = db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found.")
    owner = (
        db.query(User)
        .filter(User.email == data.email.strip().lower(), User.role == "shop_owner")
        .first()
    )
    if not owner:
        raise HTTPException(status_code=404, detail="Shop owner account not found.")
    business.owner_user_id = owner.id
    db.commit()
    return {"message": f"{business.name} is now assigned to {owner.name}."}
