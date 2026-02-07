import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def test_connection():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

def create_tables():
    Base.metadata.create_all(engine)

