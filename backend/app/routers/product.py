from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Business, Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
):
    business = db.get(Business, product_data.business_id)

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Business not found",
        )

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
    db: Session = Depends(get_db),
):
    return (
        db.query(Product)
        .filter(Product.business_id == business_id)
        .all()
    )
