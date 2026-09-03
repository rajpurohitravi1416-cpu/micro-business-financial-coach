from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    total_due: Mapped[float] = mapped_column(
        Float,
        default=0,
    )
