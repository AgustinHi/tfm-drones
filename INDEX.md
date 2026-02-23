# 📚 Documentación Completa - DronHangar

## Inicio Rápido 🚀

| Documento | Descripción | Lectores |
|-----------|-------------|----------|
| **[README.md](README.md)** | Overview del proyecto | Todos |
| **[RELEASE_NOTES.md](RELEASE_NOTES.md)** | Qué hay de nuevo en v1.0.0 | Product managers |
| **[QUICK_START.md](#quick-start)** | Comenzar en 5 minutos | Developers |

---

## 📖 Documentación por Rol

### 👨‍💼 Para Directores/PM

1. **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Resumen ejecutivo
2. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Status de entrega
3. **[Presentación Canva](CANVA_PRESENTATION_INPUT.txt)** - Input para presentación

### 👨‍🏫 Para Revisores Académicos

1. **[README.md](README.md)** - Descripción completa
2. **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Diseño del sistema
3. **[docs/BD.md](docs/BD.md)** - Modelo de datos
4. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Criterios cumplidos

### 👨‍💻 Para Developers

1. **[QUICK_START.md](#quick-start)** - Setup local
2. **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guía de desarrollo
3. **[docs/EJECUCION_LOCAL.md](docs/EJECUCION_LOCAL.md)** - Instrucciones detalladas
4. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy a producción

### 🔒 Para DevOps/Security

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Infraestructura
2. **[SECURITY_IMPROVEMENTS.txt](SECURITY_IMPROVEMENTS.txt)** - Medidas seguridad
3. **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)** - Diseño seguridad

---

## 📚 Documentación Técnica Completa

### Backend (FastAPI)

```
backend/
├── main.py                 # Aplicación FastAPI + middlewares
├── auth_routes.py          # Rutas autenticación
├── community_routes.py     # Rutas comunidad
├── auth.py                 # Función crypto JWT/password
├── models.py               # Modelos SQLAlchemy
├── user_models.py          # Extensiones user model
├── db.py                   # Configuración DB
├── requirements.txt        # Dependencias (pip)
├── conftest.py             # Config pytest
├── test_auth.py            # Tests autenticación
├── test_db.py              # Tests base de datos
├── test_models.py          # Tests modelos
└── .env.example            # Template variables entorno
```

### Frontend (React)

```
frontend/
├── src/
│   ├── App.jsx             # Componente principal
│   ├── api.js              # Cliente API
│   ├── auth.js             # Manejo autenticación
│   ├── components/         # Componentes reutilizables
│   ├── pages/              # Páginas
│   ├── hooks/              # Hooks personalizados
│   └── __tests__/          # Tests Vitest
├── package.json            # Dependencias npm
├── vite.config.js          # Config Vite
├── vitest.config.js        # Config Vitest
└── eslint.config.js        # Config ESLint
```

### Documentación

```
docs/
├── ARQUITECTURA.md         # Diseño del sistema
├── BD.md                   # Esquema base de datos
├── EJECUCION_LOCAL.md      # Setup local
├── postman/
│   └── post.json           # Colección API
└── slides/
    └── SLIDES.md           # Presentación TFM
```

---

## 🎯 Estructura Documentos

### Nivel 1: Introducción (Todos)
- ✅ **README.md** - Descripción general
- ✅ **RELEASE_NOTES.md** - Novedad v1.0.0

### Nivel 2: Setup (Developers)
- ✅ **QUICK_START.md** (este documento)
- ✅ **docs/EJECUCION_LOCAL.md** - Detallado
- ✅ **CONTRIBUTING.md** - Desarrollo equipo

### Nivel 3: Producción (DevOps)
- ✅ **DEPLOYMENT.md** - Guía completa deploy
- ✅ **docs/ARQUITECTURA.md** - Diseño sistema

### Nivel 4: Referencia (Developers)
- ✅ **docs/BD.md** - Schema DB
- ✅ **docs/postman/post.json** - API testing

### Nivel 5: Mejora Continua (Todos)
- ✅ **CONTRIBUTING.md** - Pull requests
- ✅ **CHANGELOG.md** - Historial cambios
- ✅ **SECURITY_IMPROVEMENTS.txt** - Seguridad

---

## 🚀 Quick Start

### 1️⃣ Requisitos Previos (2 min)

```bash
# Verificar versiones
python --version        # 3.11+
node --version         # 18+
npm --version          # 8+

# Clonar repositorio
git clone https://github.com/AgustinHi/tfm-drones.git
cd tfm-drones
```

### 2️⃣ Backend Setup (3 min)

```bash
cd backend

# Virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Dependencias
pip install -r requirements.txt

# .env (copiar .env.example)
# Editar DATABASE_URL con tus credenciales

# Ejecutar
python -m uvicorn main:app --reload
# ✅ API disponible en http://localhost:8000
# 📚 Docs en http://localhost:8000/docs
```

### 3️⃣ Frontend Setup (3 min)

```bash
cd frontend

# Instalar
npm install

# Ejecutar
npm run dev
# ✅ Frontend en http://localhost:5173
```

### 4️⃣ Tests (2 min)

```bash
cd backend

# Ejecutar tests
pytest -v
# ✅ Esperado: 21/21 passed
```

---

## ✅ Verificación Después Setup

```bash
# Backend
curl http://localhost:8000/docs
# Debería cargar Swagger UI

# Frontend
curl http://localhost:5173
# Debería cargar index.html

# Tests
pytest -v --tb=short
# Debería mostrar 21 passed
```

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│                   (http://localhost:5173)               │
└────────────────────────┬────────────────────────────────┘
                        │
                        │ REST API + WebSocket
                        │
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                    │
│  - Pages, Components, Hooks                            │
│  - State Management                                    │
│  - Axios HTTP Client                                  │
└────────────────────────┬────────────────────────────────┘
                        │
         ┌──────────────┐  ┌──────────────┐
         │ HTTP/HTTPS   │  │  WebSocket   │
         └──────────────┘  └──────────────┘
                        │
                        │
┌─────────────────────────────────────────────────────────┐
│           Backend (FastAPI - Port 8000)               │
│  - Authentication (JWT)                               │
│  - Business Logic                                     │
│  - Database Operations                                │
│  - File Upload/Download                               │
└────────────────────────┬────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
┌─────────────────────────┐   ┌─────────────────────────┐
│   MySQL Database        │   │  File System            │
│  (tfm_drones)           │   │  (uploads/)             │
│  - users                │   │  - drone_dumps          │
│  - drones               │   │  - posts_attachments    │
│  - drone_dumps          │   │  - user_avatars         │
│  - posts                │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

---

## 📊 Testing

### Backend

```bash
cd backend

# Todos los tests
pytest -v                    # 21/21 ✅

# Específico módulo
pytest test_auth.py -v       # Auth tests
pytest test_models.py -v     # Model tests
pytest test_db.py -v         # DB tests

# Con coverage
pytest --cov=. --cov-report=term-missing
```

### Frontend

```bash
cd frontend

# Linting
npm run lint              # ESLint (0 errors)

# Build test
npm run build            # Vite build

# Unit tests (ready)
npm run test            # Vitest
```

---

## 📚 Documentos por Audiencia

### Ejecutivos / Management 👔

1. **[RELEASE_NOTES.md](RELEASE_NOTES.md)** ← EMPEZAR AQUÍ
   - Status general
   - Features principales
   - Estadísticas proyecto
   - Roadmap

2. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**
   - Criterios entrega
   - Verificación final
   - Estatus producción

### Académicos / Profesores 🎓

1. **[README.md](README.md)** ← EMPEZAR AQUÍ  
   - Descripción general
   - Stack tecnológico
   - Instrucciones setup

2. **[docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)**
   - Diseño del sistema
   - Patrones arquitectónicos
   - Decisiones técnicas

3. **[docs/BD.md](docs/BD.md)**
   - Modelo entidad-relación
   - Schema completo
   - Decisiones de diseño

### Desarrolladores 👨‍💻

1. **[QUICK_START.md](INDEX.md)** ← EMPEZAR AQUÍ  
   - Setup en 5 minutos
   - Primeros pasos

2. **[CONTRIBUTING.md](CONTRIBUTING.md)**
   - Cómo contribuir
   - Style guides
   - Proceso PR

3. **[docs/EJECUCION_LOCAL.md](docs/EJECUCION_LOCAL.md)**
   - Setup detallado
   - Troubleshooting
   - Debugging tips

### DevOps / Infrastructure 🔧

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** ← EMPEZAR AQUÍ
   - Production setup
   - Nginx configuration
   - Docker (opcional)
   - Monitoring

2. **[SECURITY_IMPROVEMENTS.txt](SECURITY_IMPROVEMENTS.txt)**
   - Security measures
   - Headers config
   - Best practices

---

## 🔗 Links Útiles

| Recurso | Link |
|---------|------|
| API Docs | http://localhost:8000/docs |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Frontend | http://localhost:5173 |
| GitHub Repo | https://github.com/AgustinHi/tfm-drones |

---

## ⚡ Comandos Clave

```bash
# Backend
cd backend && python -m uvicorn main:app --reload

# Frontend
cd frontend && npm run dev

# Tests
cd backend && pytest -v

# Build fronted
cd frontend && npm run build

# Lint
cd frontend && npm run lint

# Database setup
mysql -u root -p < database_script.sql
```

---

## 🆘 Ayuda rápida

### Problema: "ModuleNotFoundError: No module named 'fastapi'"
```bash
cd backend
pip install -r requirements.txt
```

### Problema: "Port 8000 already in use"
```bash
# Usar otro puerto
uvicorn main:app --port 8001

# O matar proceso
lsof -i :8000  # Linux/Mac
netstat -ano | findstr :8000  # Windows
```

### Problema: "Cannot GET /"
```bash
# Asegurar frontend build
cd frontend && npm run build

# O ejecutar dev server
npm run dev
```

---

## 📞 Soporte

| Necesidad | Recurso |
|-----------|---------|
| Documentación | [README.md](README.md) |
| Primeros pasos | [QUICK_START.md](#quick-start) |
| Desarrollo | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Reportar bugs | [GitHub Issues](https://github.com/AgustinHi/tfm-drones/issues) |

---

## 📋 Documentación Checklist

- [x] README.md
- [x] RELEASE_NOTES.md
- [x] DEPLOYMENT_CHECKLIST.md
- [x] CONTRIBUTING.md
- [x] DEPLOYMENT.md
- [x] CHANGELOG.md
- [x] docs/ARQUITECTURA.md
- [x] docs/BD.md
- [x] docs/EJECUCION_LOCAL.md
- [x] SECURITY_IMPROVEMENTS.txt
- [x] API Postman collection
- [x] .env.example
- [x] Este índice

---

**¡El proyecto está completamente documentado y listo para entregar! 📦✅**

Última actualización: 19 de Febrero de 2026

