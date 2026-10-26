import jwt

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .database import get_db
from .models import User, Application
from .auth_schemas import UserCreate, UserLogin, TokenResponse, UserOut
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_user_id_from_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    # Check whether this is the first account.
    user_count = (
        db.scalar(select(func.count()).select_from(User)) or 0
    )

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
    )

    try:
        db.add(user)
        db.flush()

        # Preserve the old applications by assigning them
        # to the first account created on this database.
        if user_count == 0:
            db.execute(
                update(Application)
                .where(Application.user_id.is_(None))
                .values(user_id=user.id)
            )

        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None or not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return TokenResponse(
        access_token=create_access_token(user.id)
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        user_id = get_user_id_from_token(token)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


@router.get("/me", response_model=UserOut)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user