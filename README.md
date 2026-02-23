# DronHangar: Plataforma de Gestión de Drones

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg?style=flat-square)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.129.0-009485.svg?style=flat-square)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/react-18+-61DAFB.svg?style=flat-square)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/node.js-18+-339933.svg?style=flat-square)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-21/21%20passing-brightgreen.svg?style=flat-square)](#tests)

**Trabajo Final de Master (TFM)** - Plataforma web moderna para la gestión integral de drones, incluyendo autenticación segura, CRUD de aeronaves, análisis de dumps de configuración y comunidad de usuarios.

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos](#-requisitos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Ejecución](#-ejecución)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Documentación](#-documentación)
- [Contribuciones](#-contribuciones)
- [Licencia](#-licencia)
- [Autor](#-autor)

---

## 📖 Descripción

**DronHangar** es una plataforma web integral para la gestión de drones dirigida a pilotos, técnicos y organizaciones. Proporciona herramientas avanzadas para:

- Gestionar un inventario personal de drones
- Analizar configuraciones y dumps de dispositivos
- Participar en una comunidad de usuarios
- Compartir conocimiento sobre mantenimiento y configuración

La aplicación está construida con un enfoque moderno utilizando tecnologías full-stack actuales (FastAPI, React, MySQL) y sigue mejores prácticas de desarrollo incluyendo autenticación JWT, validación de datos, testing automatizado y manejo seguro de archivos.

---

## ✨ Características

### Autenticación y Seguridad
- ✅ Registro e inicio de sesión con validación de email
- ✅ Tokens JWT con expiración configurable
- ✅ Hashing de contraseñas con PBKDF2
- ✅ Autorización basada en usuario para datos privados

### Gestión de Drones
- ✅ CRUD completo de drones (crear, leer, actualizar, eliminar)
- ✅ Información estructurada: marca, modelo, tipo, notas
- ✅ Asociación automática de drones al usuario propietario
- ✅ Validación en tiempo real de datos

### Gestión de Dumps
- ✅ Subida segura de archivos de configuración (dumps)
- ✅ Soporte para múltiples formatos: `.sql`, `.dump`, `.gz`, `.zip`, `.txt`
- ✅ Análisis y parseo automático de dumps (formato Betaflight-like)
- ✅ Límites de seguridad: 20 MB por archivo
- ✅ Almacenamiento organizado por dron

### Comunidad
- ✅ Foro de discusión
- ✅ Compartir posts sobre drones y configuraciones
- ✅ Gestión de comentarios

### Experiencia de Usuario
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Soporte multiidioma: Español e Inglés
- ✅ Navegación intuitiva con React Router

---

## 🛠️ Stack Tecnológico

### Backend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | **FastAPI** | 0.129.0 |
| ORM | **SQLAlchemy** | 2.0.46 |
| Authentication | **PyJWT** | 2.11.0 |
| Password Hashing | **Passlib** | 1.7.4 |
| Database Driver | **PyMySQL** | 1.1.2 |
| ASGI Server | **Uvicorn** | 0.40.0 |

### Frontend

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | **React** | 18.x |
| Build Tool | **Vite** | 7.3.1 |
| Styling | **Tailwind CSS** | - |
| Routing | **React Router** | - |
| i18n | **react-i18next** | - |
| HTTP Client | **Axios** | 1.13.5 |

### Infraestructura
- **Database:** MySQL / MariaDB
- **Development:** Python 3.11+, Node.js 18+
- **Testing:** Pytest, Vitest
- **Linting:** ESLint, Pylance

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                 │
│                   http://localhost:5173                      │
└─────────────┬───────────────────────────────────────────────┘
              │ HTTP/REST
              ↓
┌─────────────────────────────────────────────────────────────┐
│                Backend (FastAPI + SQLAlchemy)                │
│                   http://localhost:8000                      │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  /auth         - Autenticación JWT                      │ │
│  │  /drones       - CRUD de aeronaves                      │ │
│  │  /dumps        - Gestión de configuraciones             │ │
│  │  /community    - Foro y posts                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────────────────────────────┘
              │ TCP/3306
              ↓
┌─────────────────────────────────────────────────────────────┐
│              Database (MySQL / MariaDB)                       │
│                  tfm_drones schema                           │
└─────────────────────────────────────────────────────────────┘
```

### Modelos de Datos

**User**
```python
- id: Integer (PK)
- email: String (Unique)
- password_hash: String
- created_at: DateTime
```

**Drone**
```python
- id: Integer (PK)
- owner_email: String (FK → User.email)
- brand: String
- model: String
- drone_type: String
- notes: Text (Optional)
- created_at: DateTime
```

**DroneDump**
```python
- id: Integer (PK)
- drone_id: Integer (FK → Drone.id)
- filename: String
- file_path: String
- size: Integer
- created_at: DateTime
```

**Post (Community)**
```python
- id: Integer (PK)
- author_email: String (FK)
- title: String
- content: Text
- created_at: DateTime
- updated_at: DateTime
```

---

## 📁 Estructura del Proyecto

```
tfm-drones/
├── backend/                          # API REST FastAPI
│   ├── main.py                       # Aplicación principal
│   ├── auth.py                       # Lógica de autenticación
│   ├── auth_routes.py                # Endpoints /auth
│   ├── community_routes.py           # Endpoints /community
│   ├── db.py                         # Configuración base de datos
│   ├── models.py                     # Modelos SQLAlchemy (Drone, DroneDump)
│   ├── user_models.py                # Modelo User
│   ├── requirements.txt              # Dependencias Python
│   ├── conftest.py                   # Configuración pytest
│   ├── test_auth.py                  # Tests autenticación
│   ├── test_db.py                    # Tests base de datos
│   ├── test_models.py                # Tests modelos
│   └── uploads/                      # Directorio para dumps subidos
│
├── frontend/                          # App React + Vite
│   ├── src/
│   │   ├── main.jsx                  # Punto de entrada
│   │   ├── App.jsx                   # Componente raíz
│   │   ├── api.js                    # Cliente HTTP (Axios)
│   │   ├── auth.js                   # Lógica de autenticación
│   │   ├── components/               # Componentes reutilizables
│   │   │   ├── home/                 # Componentes página inicio
│   │   │   └── ui/                   # Componentes UI (Button, Input, etc.)
│   │   ├── pages/                    # Páginas principales
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Manage.jsx            # Gestión de drones
│   │   │   ├── DroneDetail.jsx
│   │   │   ├── DumpParse.jsx
│   │   │   └── CommunityForum.jsx
│   │   ├── layouts/                  # Layouts
│   │   ├── hooks/                    # Custom hooks
│   │   ├── __tests__/                # Tests Vitest
│   │   └── assets/                   # Imágenes y recursos
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docs/                              # Documentación
│   ├── ARQUITECTURA.md               # Diseño del sistema
│   ├── BD.md                         # Esquema base de datos
│   ├── EJECUCION_LOCAL.md            # Guía de instalación
│   ├── postman/                      # Colección API Postman
│   ├── samples/                      # Ejemplos de datos
│   └── slides/                       # Presentación
│
├── LICENSE                            # Licencia MIT
├── README.md                          # Este archivo
└── package.json                       # Metadatos proyecto
```

---

## 📋 Requisitos

### Sistema
- **Python:** 3.11 o superior
- **Node.js:** 18.x o superior
- **npm:** 9.x o superior
- **MySQL:** 5.7+ o MariaDB 10.3+

### Verificación
```bash
# Verificar Python
python --version  # ≥ 3.11.0

# Verificar Node.js
node --version    # ≥ 18.0.0
npm --version     # ≥ 9.0.0
```

---

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/AgustinHi/tfm-drones.git
cd tfm-drones
```

### 2. Configurar Base de Datos

#### Opción A: Con XAMPP (recomendado para desarrollo)

1. Descargar y instalar [XAMPP](https://www.apachefriends.org/)
2. Iniciar MySQL desde el panel de control
3. Abrir phpMyAdmin: http://localhost/phpmyadmin
4. Crear base de datos:

```sql
CREATE DATABASE tfm_drones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Opción B: Con comando MySQL

```bash
mysql -u root -p << EOF
CREATE DATABASE tfm_drones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
```

### 3. Backend - Configuración Python

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# En Windows:
.\.venv\Scripts\activate
# En macOS/Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
echo "DATABASE_URL=mysql+pymysql://root:@localhost/tfm_drones" > .env
echo "JWT_SECRET=tu_clave_secreta_aqui_min_32_caracteres" >> .env
echo "JWT_ALGORITHM=HS256" >> .env
```

**Archivo `.env` esperado:**

```ini
DATABASE_URL=mysql+pymysql://root:password@localhost/tfm_drones
JWT_SECRET=tu_clave_secreta_super_segura_minimo_32_caracteres_aqui
JWT_ALGORITHM=HS256
```

### 4. Frontend - Configuración Node.js

```bash
cd frontend

# Instalar dependencias
npm install

# Verificar calidad de código
npm run lint  # Ejecutar linter
npm run build # Compilar para producción
```

---

## 🚀 Ejecución

### Opción 1: Ejecutar Backend y Frontend por Separado

**Terminal 1 - Backend:**

```bash
cd backend

# Activar entorno virtual (si no está activo)
source .venv/bin/activate  # macOS/Linux
# o
.\.venv\Scripts\activate   # Windows

# Iniciar servidor FastAPI
python -m uvicorn main:app --reload
```

El backend estará disponible en: **http://localhost:8000**  
Documentación interactiva: **http://localhost:8000/docs**

**Terminal 2 - Frontend:**

```bash
cd frontend

# Iniciar servidor de desarrollo Vite
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

### Opción 2: Con VS Code (recomendado)

Si tienes configured las tareas, presiona `Ctrl+Shift+P` y escribe:
```
Tasks: Run Task → "Dev: start frontend + backend"
```

---

## 🔌 API Endpoints

### Autenticación `/auth`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/auth/me` | Obtener usuario actual |

**Ejemplo - Registro:**

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

### Drones `/drones`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/drones` | Listar drones | ✅ |
| GET | `/drones/{id}` | Obtener detalles | ✅ |
| POST | `/drones` | Crear dron | ✅ |
| PUT | `/drones/{id}` | Actualizar dron | ✅ |
| DELETE | `/drones/{id}` | Eliminar dron | ✅ |

**Ejemplo - Crear Dron:**

```bash
curl -X POST "http://localhost:8000/drones" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "DJI",
    "model": "Mini 3 Pro",
    "drone_type": "Quadcopter",
    "notes": "Dron compacto para fotografía aérea"
  }'
```

### Dumps `/dumps`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/drones/{drone_id}/dumps` | Listar dumps | ✅ |
| POST | `/dumps` | Subir dump | ✅ |
| DELETE | `/drones/{drone_id}/dumps/{dump_id}` | Eliminar dump | ✅ |
| GET | `/drones/{drone_id}/dumps/{dump_id}/parse` | Analizar dump | ✅ |

**Ejemplo - Subir Dump:**

```bash
curl -X POST "http://localhost:8000/dumps" \
  -H "Authorization: Bearer <token>" \
  -F "drone_id=1" \
  -F "file=@dump.txt"
```

### Comunidad `/community`

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/community/posts` | Listar posts | ❌ |
| POST | `/community/posts` | Crear post | ✅ |
| POST | `/community/posts/{id}/reply` | Responder | ✅ |

**Documentación Interactiva:** http://localhost:8000/docs (Swagger UI)

---

## 🧪 Testing

### Backend

```bash
cd backend

# Ejecutar todos los tests
pytest -v

# Resultado esperado: 21 passed
```

### Frontend

```bash
cd frontend

# Verificar linter
npm run lint

# Compilar para validar
npm run build
```

---

## 📚 Documentación Adicional

- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Esquema de Base de Datos](docs/BD.md)
- [Guía de Ejecución Local](docs/EJECUCION_LOCAL.md)
- [Colección Postman](docs/postman/post.json)
- [Presentación TFM](docs/slides/SLIDES.md)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Estilo
- **Backend:** PEP 8 con Pylance
- **Frontend:** ESLint config
- **Tests:** 80%+ cobertura
- **Commits:** Descriptivos en inglés/español

---

## 📝 Requisitos Implementados

- ✅ Seguridad: Autenticación JWT + PBKDF2
- ✅ Testing: 21/21 tests unitarios
- ✅ Escalabilidad: Arquitectura modular
- ✅ Mantenibilidad: Código refactorizado
- ✅ Documentación: README, docstrings, API
- ✅ Performance: Índices BD, límites upload
- ✅ Accesibilidad: UI responsive, multiidioma

---

## 🔒 Licencia

Licenciado bajo MIT License - Ver [LICENSE](LICENSE)

---

## 👤 Autor

**Agustín Hernández**

- 🍀 GitHub: [@AgustinHi](https://github.com/AgustinHi)

---

**Version:** 1.0.0 | **Status:** Production Ready ✅ | **Última actualización:** Febrero 2025
