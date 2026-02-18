import pytest
from sqlalchemy.orm import Session
from auth import hash_password, verify_password, create_access_token, JWT_SECRET
import jwt


class TestAuthFunctions:
    """Tests para funciones de autenticación"""

    def test_hash_password(self):
        """Test que verifica hash de contraseña"""
        password = "test123"
        hashed = hash_password(password)
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_valid(self):
        """Test que verifica contraseña correcta"""
        password = "test123"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_invalid(self):
        """Test que rechaza contraseña incorrecta"""
        password = "test123"
        wrong_password = "wrong123"
        hashed = hash_password(password)
        assert verify_password(wrong_password, hashed) is False

    def test_create_access_token(self):
        """Test que verifica creación de token JWT"""
        email = "test@example.com"
        token = create_access_token(subject=email)
        assert token is not None
        assert isinstance(token, str)

        # Verificar que el token puede decodificarse
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        assert payload["sub"] == email
        assert "exp" in payload
        assert "iat" in payload


class TestAuthEndpoints:
    """Tests para endpoints de autenticación"""

    def test_register_success(self, client):
        """Test registro exitoso"""
        response = client.post(
            "/auth/register",
            json={"email": "newuser@example.com", "password": "SecurePass123"},  # pragma: allowlist secret
        )
        assert response.status_code == 201
        assert response.json()["email"] == "newuser@example.com"

    def test_register_duplicate_email(self, client):
        """Test que rechaza email duplicado"""
        email = "duplicate@example.com"
        password = "SecurePass123"  # pragma: allowlist secret

        # Primer registro
        response1 = client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )
        assert response1.status_code == 201

        # Segundo registro con mismo email
        response2 = client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )
        assert response2.status_code == 409
        assert "already exists" in response2.json()["detail"]

    def test_register_invalid_email(self, client):
        """Test que rechaza email inválido"""
        response = client.post(
            "/auth/register",
            json={"email": "not-an-email", "password": "SecurePass123"},  # pragma: allowlist secret
        )
        assert response.status_code == 422  # Validation error

    def test_login_success(self, client):
        """Test login exitoso"""
        email = "logintest@example.com"
        password = "SecurePass123"  # pragma: allowlist secret

        # Registrar usuario
        client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )

        # Login
        response = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert response.json()["token_type"] == "bearer"

    def test_login_invalid_email(self, client):
        """Test login con email inexistente"""
        response = client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "anypass"},
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_invalid_password(self, client):
        """Test login con contraseña incorrecta"""
        email = "passwordtest@example.com"
        password = "SecurePass123"  # pragma: allowlist secret

        # Registrar usuario
        client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )

        # Login con contraseña incorrecta
        response = client.post(
            "/auth/login",
            json={"email": email, "password": "WrongPassword"},
        )
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_me_with_valid_token(self, client):
        """Test endpoint /me con token válido"""
        email = "metest@example.com"
        password = "SecurePass123"  # pragma: allowlist secret

        # Registrar
        client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )

        # Login
        login_response = client.post(
            "/auth/login",
            json={"email": email, "password": password},
        )
        token = login_response.json()["access_token"]

        # Llamar /me
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == email

    def test_me_without_token(self, client):
        """Test endpoint /me sin token"""
        response = client.get("/auth/me")
        assert response.status_code == 401
        assert "Missing bearer token" in response.json()["detail"]

    def test_me_with_invalid_token(self, client):
        """Test endpoint /me con token inválido"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
