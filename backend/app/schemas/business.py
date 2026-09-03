from pydantic import BaseModel, ConfigDict, Field


class BusinessCreate(BaseModel):
    name: str
    owner_name: str
    phone: str | None = None
    opening_cash: float = Field(default=0, ge=0)


class BusinessResponse(BusinessCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
