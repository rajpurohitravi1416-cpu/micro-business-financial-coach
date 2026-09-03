from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PurchaseCreate(BaseModel):
    business_id: int
    product_id: int
    quantity: float = Field(gt=0)
    purchase_price: float = Field(gt=0)
    payment_mode: str = "cash"

class PurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    product_id: int
    quantity: float
    purchase_price: float
    total_amount: float
    payment_mode: str   
    created_at: datetime
