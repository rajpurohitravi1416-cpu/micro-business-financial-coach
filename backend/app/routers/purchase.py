from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Product, Purchase, User
from app.schemas.purchase import PurchaseCreate, PurchaseResponse

router = APIRouter(prefix="/purchases", tags=["Purchases"])


@router.post("/", response_model=PurchaseResponse)
def create_purchase(
    purchase_data: PurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, purchase_data.business_id)
    product = (
        db.query(Product)
        .filter(
            Product.id == purchase_data.product_id,
            Product.business_id == purchase_data.business_id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    total_amount = (
        purchase_data.purchase_price * purchase_data.quantity
    )

    purchase = Purchase(
        business_id=purchase_data.business_id,
        product_id=purchase_data.product_id,
        quantity=purchase_data.quantity,
        purchase_price=purchase_data.purchase_price,
        total_amount=total_amount,
 payment_mode=purchase_data.payment_mode,
    )

    product.stock_quantity += purchase_data.quantity

    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return purchase


@router.get(
    "/business/{business_id}",
    response_model=list[PurchaseResponse],
)
def get_purchases(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Purchase)
        .filter(Purchase.business_id == business_id)
        .order_by(Purchase.created_at.desc())
        .all()
    )
