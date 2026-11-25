from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Product, User
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, product_data.business_id)

    product = Product(
        business_id=product_data.business_id,
        name=product_data.name,
        category=product_data.category,
        purchase_price=product_data.purchase_price,
        selling_price=product_data.selling_price,
        stock_quantity=product_data.stock_quantity,
        minimum_stock=product_data.minimum_stock,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get(
    "/business/{business_id}",
    response_model=list[ProductResponse],
)
def get_products(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    )
