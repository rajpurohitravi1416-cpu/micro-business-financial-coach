"""add payment mode to purchases

Revision ID: 1bdd5c307e35
Revises:
Create Date:
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1bdd5c307e35"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("purchases", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "payment_mode",
                sa.String(length=30),
                nullable=False,
                server_default="cash",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("purchases", schema=None) as batch_op:
        batch_op.drop_column("payment_mode")
