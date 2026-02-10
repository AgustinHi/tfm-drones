# backend/db.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from models import Base
import user_models  # noqa: F401  (asegura que se registren modelos de usuarios)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL no está definida en el .env")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def test_connection():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

def create_tables():
    Base.metadata.create_all(engine)
