from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SaleCreate(BaseModel):
    business_id: int
    product_id: int
    quantity: float
    payment_mode: str = "cash"
    customer_id: int | None = None
    due_date: datetime | None = None


class SaleResponse(BaseModel):
    id: int
    business_id: int
    product_id: int
    quantity: float
    selling_price: float
    cost_price: float
    total_amount: float
    profit: float
    payment_mode: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
