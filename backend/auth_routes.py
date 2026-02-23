from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session
import time
import logging

import jwt  # PyJWT
from jwt import InvalidTokenError

from db import engine
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    JWT_SECRET,
    JWT_ALG,
)
from user_models import User

# Logger de seguridad
security_logger = logging.getLogger("security")

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterPayload(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!"
            }
        }
    )
    
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Mínimo 8 caracteres")


class LoginPayload(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!"
            }
        }
    )
    
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128, description="Contraseña de usuario")


def get_current_user_email(authorization: str | None = Header(default=None)) -> str:
    """
    Espera: Authorization: Bearer <token>
    Devuelve el email (sub) si el token es válido.
    Con rate limiting implícito mediante validación estricta.
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Log intento fallido
        security_logger.warning(f"Unauthorized access attempt: missing bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = authorization.split(" ", 1)[1].strip()
    
    # Validación básica del token (previene tokens vacíos/malformados)
    if not token or len(token) < 20:
        security_logger.warning(f"Invalid token format attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALG],
            options={"require": ["exp", "sub"], "verify_exp": True},  # Verificar expiration
        )
    except jwt.ExpiredSignatureError:
        logging.info(f"Expired token attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except InvalidTokenError as e:
        logging.warning(f"Invalid token attempt: {str(e)[:50]}")
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
    # Validação adicional de email
    if not payload.email or len(payload.email) > 255:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid email format",
        )
    
    # Validación de contraseña (evita contraseñas débiles obvias)
    if payload.password.lower() in ["password", "123456", "qwerty", payload.email.lower()]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password too weak. Choose a stronger password.",
        )
    
    with Session(engine) as session:
        existing = session.scalar(select(User).where(User.email == payload.email))
        if existing:
            security_logger.warning(f"Registration attempt with existing email: {payload.email[:3]}***")
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
    # Pequeño delay defensivo contra brute force
    login_delay = 0.1
    
    with Session(engine) as session:
        u = session.scalar(select(User).where(User.email == payload.email))
        if u is None:
            security_logger.warning(f"Login attempt with non-existent email: {payload.email[:3]}***")
            # Delay para evitar timing attacks
            time.sleep(login_delay)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(payload.password, u.password_hash):
            security_logger.warning(f"Failed login attempt for user: {u.email[:3]}***")
            # Delay para desalentar brute force
            time.sleep(login_delay)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        token = create_access_token(subject=u.email)
        security_logger.info(f"Successful login for user: {u.email[:3]}***")
        return {"access_token": token, "token_type": "bearer"}
