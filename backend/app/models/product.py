from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(150))
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)

    purchase_price: Mapped[float] = mapped_column(Float, default=0)
    selling_price: Mapped[float] = mapped_column(Float, default=0)

    stock_quantity: Mapped[float] = mapped_column(Float, default=0)

    minimum_stock: Mapped[float] = mapped_column(Float, default=0)

    business = relationship(
        "Business",
        back_populates="products",
    )
