import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Configurar DB de test usando SQLite en memoria
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine_test = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db():
    """Fixture que crea/limpia la BD de test para cada test."""
    from models import Base

    Base.metadata.create_all(bind=engine_test)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture(scope="function")
def client(db):
    """Fixture que proporciona TestClient con BD de test."""
    from main import app
    from db import engine as original_engine

    app.dependency_overrides[original_engine] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
