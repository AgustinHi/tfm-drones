from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from db import engine
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET,
    JWT_ALG,
)
from user_models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


def get_current_user_email(authorization: str | None = Header(default=None)) -> str:
    """
    Espera: Authorization: Bearer <token>
    Devuelve el email (sub) si el token es válido.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    email = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return str(email)


@router.get("/me")
def me(email: str = Depends(get_current_user_email)):
    """
    Endpoint estándar para comprobar autenticación.
    Devuelve el email asociado al token.
    """
    return {"email": email}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload):
    with Session(engine) as session:
        existing = session.scalar(select(User).where(User.email == payload.email))
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists",
            )

        u = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
        )
        session.add(u)
        session.commit()
        session.refresh(u)

        return {"id": u.id, "email": u.email}


@router.post("/login")
def login(payload: LoginPayload):
    with Session(engine) as session:
        u = session.scalar(select(User).where(User.email == payload.email))
        if u is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(payload.password, u.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        token = create_access_token(subject=u.email)
        return {"access_token": token, "token_type": "bearer"}
