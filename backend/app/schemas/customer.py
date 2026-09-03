from pydantic import BaseModel, ConfigDict


class CustomerCreate(BaseModel):
    business_id: int
    name: str
    phone: str | None = None


class CustomerResponse(BaseModel):
    id: int
    business_id: int
    name: str
    phone: str | None
    total_due: float

    model_config = ConfigDict(from_attributes=True)
