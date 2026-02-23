import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Crear un nuevo engine para cada test
@pytest.fixture(scope="function")
def test_engine():
    """Fixture que crea un nuevo engine SQLite en memoria para cada test."""
    TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
    
    engine_test = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    from models import Base
    Base.metadata.create_all(bind=engine_test)
    
    yield engine_test
    
    Base.metadata.drop_all(bind=engine_test)
    engine_test.dispose()


@pytest.fixture(scope="function")
def db(test_engine):
    """Fixture que proporciona una sesión para acceder a la BD de test."""
    from sqlalchemy.orm import sessionmaker
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = SessionLocal()
    
    yield session
    
    session.close()


@pytest.fixture(scope="function")
def client(test_engine, monkeypatch):
    """Fixture que proporciona TestClient con BD de test limpia."""
    from main import app
    from db import engine as original_engine
    
    # Reemplazar el engine global con el de test
    monkeypatch.setattr("db.engine", test_engine)
    monkeypatch.setattr("auth_routes.engine", test_engine)
    monkeypatch.setattr("community_routes.engine", test_engine)
    monkeypatch.setattr("main.engine", test_engine)

    with TestClient(app) as test_client:
        yield test_client
