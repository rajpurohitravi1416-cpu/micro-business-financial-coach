from datetime import datetime

from pydantic import BaseModel


class UdhaarCreate(BaseModel):
    business_id: int
    customer_id: int
    amount: float
    due_date: datetime | None = None


class UdhaarPayment(BaseModel):
    amount_paid: float


class UdhaarResponse(BaseModel):
    id: int
    business_id: int
    customer_id: int
    amount: float
    amount_paid: float
    status: str
    due_date: datetime | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
