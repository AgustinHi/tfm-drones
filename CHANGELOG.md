# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-19

### ✨ Added (Agregado)

#### Backend
- **FastAPI Application**: Framework principal con structure modular
- **Authentication System**: 
  - JWT tokens con expiración configurable
  - Password hashing con PBKDF2
  - Email validation con email-validator
  - Rate limiting (100ms delay on failed login)
- **Security Improvements**:
  - TrustedHostMiddleware para prevenir Host Header Injection
  - Security headers (X-Content-Type-Options, CSP, HSTS, etc.)
  - CORS whitelist restrictivo
  - JWT validation mejorada con verificación explícita de expiración
  - Logging de eventos de seguridad
- **API Endpoints**:
  - `/auth/register` - Registro de usuarios
  - `/auth/login` - Login y obtención de tokens
  - `/auth/me` - Verificación de autenticación
  - `/drones/*` - CRUD de drones
  - `/community/*` - Endpoints de comunidad
  - `/dumps/*` - Gestión de configuración dumps
- **Database**:
  - SQLAlchemy ORM (previene SQL injection)
  - Models: User, Drone, DroneDump, Post
  - Relaciones: Foreign keys, cascades
  - Indexes para performance

#### Frontend
- **React Application**: UI moderna con Vite
- **Components**: 
  - Hero section, Features section, Resources section
  - Drone card component (responsive)
  - Forms para register/login
  - File upload para dumps
- **Features**:
  - Autenticación con JWT
  - Multiidioma (español/inglés) con react-i18next
  - Responsive design con Tailwind CSS
  - Protected routes basadas en tokens
- **Tooling**:
  - Vite para build/dev rápido
  - ESLint para code quality
  - Vitest para testing

#### Testing
- **Backend**: 21 unit tests (100% passing)
  - Auth functions tests (4)
  - Auth endpoints tests (10)
  - Database tests (1)
  - Model tests (6)
- **Frontend**: ESLint linting + Vitest ready

#### Documentation
- Complete README.md (536 líneas)
- Architecture documentation (ARQUITECTURA.md)
- Database schema (BD.md)
- Local execution guide (EJECUCION_LOCAL.md)
- Security improvements (SECURITY_IMPROVEMENTS.txt)
- API Postman collection
- Deployment checklist

### 🔒 Security

- Autenticación segura con JWT + PBKDF2
- Validación de entrada con Pydantic
- Protección CSRF mediante tokens JWT stateless
- Prevención XSS mediante React sanitization
- Prevención SQL Injection mediante ORM SQLAlchemy
- Host Header Injection protection
- Security headers configurados
- Rate limiting contra brute force
- Email validation
- Weak password detection

### 🐛 Bug Fixes

- Fixed TrustedHostMiddleware test compatibility (testserver host)
- Fixed logging variable scope in auth validation
- Fixed test assertions para error messages
- Fixed Pydantic ConfigDict migration desde v1 a v2

### 📈 Improved (Mejorado)

- Refactored código para clean architecture
- Separated concerns (components, pages, hooks)
- Improved error handling y validation messages
- Enhanced logging para security events
- Database design con índices para performance
- File upload limits y extension validation
- CORS más restrictivo (sin wildcards)

### 📚 Documentation

- README completo con instrucciones
- API endpoints documentados
- Architecture diagram y explicación
- Database schema documentado
- Security best practices
- Testing guide
- Deployment checklist

---

## Comparativa de Versiones

### Antes de Refactorización
- ❌ 2 tipos de import en button component
- ❌ ESLint errors
- ❌ Test aislamiento issues
- ❌ Security headers no configurados
- ❌ CORS con wildcards

### Después de Refactorización (v1.0.0 - Actual)
- ✅ Clean code architecture
- ✅ ESLint: 0 errors
- ✅ Tests: 21/21 passing
- ✅ Enterprise security
- ✅ Professional documentation
- ✅ Production ready

---

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.129.0
- **ORM**: SQLAlchemy 2.0.46
- **Auth**: PyJWT 2.11.0, Passlib 1.7.4
- **Validation**: Pydantic v2
- **Server**: Uvicorn 0.40.0
- **DB**: MySQL 5.7+ / MariaDB
- **Testing**: Pytest

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite 7.3.1
- **Styling**: Tailwind CSS
- **i18n**: react-i18next
- **HTTP**: Axios 1.13.5
- **Testing**: Vitest
- **Linting**: ESLint

---

## 📋 Próximas Versiones (Roadmap)

- [ ] Integración de WebSocket para notificaciones en tiempo real
- [ ] Sistema de comentarios en foro comunitario
- [ ] Búsqueda avanzada con Elasticsearch
- [ ] Dashboard de analíticas
- [ ] Exportación de reportes en PDF
- [ ] Mobile app con React Native
- [ ] CI/CD pipeline con GitHub Actions
- [ ] Docker containerization
- [ ] Kubernetes deployment readiness

---

## 📞 Soporte

Para problemas, sugerencias o colaboraciones:
- GitHub Issues: [tfm-drones/issues](https://github.com/AgustinHi/tfm-drones/issues)
- Email: [Contacto](mailto:agustin@example.com)

---

## 📄 Licencia

Este proyecto está licenciado bajo MIT License - ver [LICENSE](LICENSE)

---

**Última actualización:** 19 de Febrero de 2026  
**Versión actual:** 1.0.0  
**Autor:** Agustín Hernández

