from datetime import datetime
from pathlib import Path
import shutil

from sqlalchemy import Engine, inspect, text

from app.db.database import engine


def backup_database_if_needed(target_engine: Engine = engine) -> Path | None:
    """Create a one-time-style timestamped backup before additive auth changes."""
    if target_engine.dialect.name != "sqlite":
        return None
    database_name = target_engine.url.database
    if not database_name or database_name == ":memory:":
        return None
    database_path = Path(database_name)
    if not database_path.is_absolute():
        database_path = Path.cwd() / database_path
    if not database_path.is_file():
        return None

    inspector = inspect(target_engine)
    tables = set(inspector.get_table_names())
    missing_auth_table = not {"users", "user_sessions"}.issubset(tables)
    missing_owner_column = (
        "businesses" in tables
        and "owner_user_id" not in {col["name"] for col in inspector.get_columns("businesses")}
    )
    if not missing_auth_table and not missing_owner_column:
        return None

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = database_path.with_name(
        f"{database_path.stem}.backup-auth-{timestamp}{database_path.suffix}"
    )
    shutil.copy2(database_path, backup_path)
    return backup_path


def ensure_auth_schema(target_engine: Engine = engine) -> None:
    """Apply the one additive SQLite column migration for existing databases."""
    inspector = inspect(target_engine)
    if "businesses" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("businesses")}
    if "owner_user_id" not in columns:
        with target_engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE businesses ADD COLUMN owner_user_id "
                    "INTEGER REFERENCES users(id)"
                )
            )
        with target_engine.begin() as connection:
            connection.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_businesses_owner_user_id "
                    "ON businesses (owner_user_id)"
                )
            )
