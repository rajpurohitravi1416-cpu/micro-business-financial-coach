from pydantic import BaseModel, ConfigDict


class ProductCreate(BaseModel):
    business_id: int
    name: str
    category: str | None = None
    purchase_price: float
    selling_price: float
    stock_quantity: float = 0
    minimum_stock: float = 0


class ProductResponse(ProductCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
