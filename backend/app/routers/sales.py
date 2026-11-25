from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user, require_business_access
from app.models import Customer, Product, Sale, Udhaar, User
from app.schemas.sale import SaleCreate, SaleResponse

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/", response_model=SaleResponse)
def create_sale(
    sale_data: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, sale_data.business_id)
    product = (
        db.query(Product)
        .filter(
            Product.id == sale_data.product_id,
            Product.business_id == sale_data.business_id,
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    if sale_data.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero",
        )

    if product.stock_quantity < sale_data.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {product.stock_quantity}",
        )

    total_amount = product.selling_price * sale_data.quantity
    total_cost = product.purchase_price * sale_data.quantity
    profit = total_amount - total_cost

    product.stock_quantity -= sale_data.quantity

    sale = Sale(
        business_id=sale_data.business_id,
        product_id=sale_data.product_id,
        quantity=sale_data.quantity,
        selling_price=product.selling_price,
        cost_price=product.purchase_price,
        total_amount=total_amount,
        profit=profit,
        payment_mode=sale_data.payment_mode,
    )

    db.add(sale)

    if sale_data.payment_mode.lower() == "udhaar":
        if not sale_data.customer_id:
            raise HTTPException(
                status_code=400,
                detail="customer_id is required for Udhaar sales",
            )

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale_data.customer_id,
                Customer.business_id == sale_data.business_id,
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )

        customer.total_due += total_amount

        udhaar = Udhaar(
            business_id=sale_data.business_id,
            customer_id=customer.id,
            amount=total_amount,
            amount_paid=0,
            status="pending",
            due_date=sale_data.due_date,
        )

        db.add(udhaar)

    db.commit()
    db.refresh(sale)

    return sale


@router.get(
    "/business/{business_id}",
    response_model=list[SaleResponse],
)
def get_sales(
    business_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_business_access(db, current_user, business_id)
    return (
        db.query(Sale)
        .filter(Sale.business_id == business_id)
        .order_by(Sale.created_at.desc())
        .all()
    )
