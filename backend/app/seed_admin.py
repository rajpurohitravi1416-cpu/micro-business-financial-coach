from getpass import getpass

from app.db.database import Base, SessionLocal, engine
from app.db.migrations import backup_database_if_needed, ensure_auth_schema
from app.models import User
from app.core.security import hash_password


def main() -> None:
    backup_database_if_needed()
    Base.metadata.create_all(bind=engine)
    ensure_auth_schema()
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password (at least 8 characters): ")
    confirmation = getpass("Confirm admin password: ")

    if not name or "@" not in email:
        raise SystemExit("Enter a name and a valid email address.")
    if len(password) < 8 or len(password) > 128:
        raise SystemExit("Password must be between 8 and 128 characters.")
    if password != confirmation:
        raise SystemExit("Passwords did not match.")

    db = SessionLocal()
    try:
        if db.query(User.id).filter(User.role == "admin").first():
            raise SystemExit("An Admin account is already configured.")
        if db.query(User.id).filter(User.email == email).first():
            raise SystemExit("An account already uses that email; no role was changed.")
        db.add(
            User(
                name=name,
                email=email,
                password_hash=hash_password(password),
                role="admin",
            )
        )
        db.commit()
        print("Admin account created. Keep its password private.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
