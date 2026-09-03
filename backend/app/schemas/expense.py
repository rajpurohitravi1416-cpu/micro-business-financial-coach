from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExpenseCreate(BaseModel):
    business_id: int
    category: str
    description: str | None = None
    amount: float
    payment_mode: str = "cash"


class ExpenseResponse(BaseModel):
    id: int
    business_id: int
    category: str
    description: str | None
    amount: float
    payment_mode: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
