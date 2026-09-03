from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"),
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        index=True,
    )

    quantity: Mapped[float] = mapped_column(Float)
    selling_price: Mapped[float] = mapped_column(Float)
    cost_price: Mapped[float] = mapped_column(Float)

    total_amount: Mapped[float] = mapped_column(Float)
    profit: Mapped[float] = mapped_column(Float)

    payment_mode: Mapped[str] = mapped_column(
        String(30),
        default="cash",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    product = relationship("Product")
