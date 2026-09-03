"""add opening cash to businesses

Revision ID: 596f6c5ec86b
Revises: d4989ecb2c95
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "596f6c5ec86b"
down_revision: Union[str, Sequence[str], None] = "d4989ecb2c95"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("businesses", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "opening_cash",
                sa.Float(),
                nullable=False,
                server_default="0",
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("businesses", schema=None) as batch_op:
        batch_op.drop_column("opening_cash")
