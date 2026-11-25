import hashlib
import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    SESSION_COOKIE,
    SESSION_DAYS,
    create_session,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.models import User, UserSession
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def normalized_email(email: str) -> str:
    value = email.strip().lower()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return value


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        samesite="lax",
        path="/",
    )


def auth_result(db: Session, user: User, response: Response) -> AuthResponse:
    raw_token, session = create_session(db, user)
    set_session_cookie(response, raw_token)
    return AuthResponse(
        user=UserResponse(id=user.id, name=user.name, email=user.email, role=user.role),
        csrf_token=session.csrf_token,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalized_email(data.email)
    if db.query(User.id).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role="shop_owner",
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    db.refresh(user)
    return auth_result(db, user, response)


@router.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = normalized_email(data.email)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return auth_result(db, user, response)


@router.get("/me")
def me(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_token = request.cookies.get(SESSION_COOKIE, "")
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
    return {
        "user": UserResponse(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            role=current_user.role,
        ),
        "csrf_token": session.csrf_token,
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_token = request.cookies.get(SESSION_COOKIE, "")
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
    if session:
        db.delete(session)
        db.commit()
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
        secure=os.getenv("COOKIE_SECURE", "false").lower() == "true",
        httponly=True,
        samesite="lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
