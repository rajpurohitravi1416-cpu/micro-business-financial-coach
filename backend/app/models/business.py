from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(150))
    owner_name: Mapped[str] = mapped_column(String(150))

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    opening_cash: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    products = relationship(
        "Product",
        back_populates="business",
        cascade="all, delete-orphan",
    )
