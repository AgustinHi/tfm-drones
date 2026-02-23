# Código de Conducta y Guía de Contribución

## 🤝 Código de Conducta

Este proyecto adopta el [Pacto de Contribuyentes](http://contributor-covenant.org/version/1/4/) Código de Conducta.

### Nuestro Compromiso

En el interés de promover un ambiente abierto y acogedor, nosotros, como colaboradores y mantenedores, nos comprometemos a hacer la participación en nuestro proyecto y nuestra comunidad una experiencia libre de acoso para todos, independientemente de la edad, tamaño corporal, discapacidad, etnia, identidad de género y expresión, nivel de experiencia, nacionalidad, apariencia física, raza, religión o identidad y orientación sexual.

### Estándares

Ejemplos de comportamiento que contribuyen a crear un ambiente positivo incluyen:

- Usar lenguaje acogedor e inclusivo
- Ser respetuoso con los puntos de vista y experiencias diferentes
- Aceptar crítica constructiva con gracia
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

---

## 🛠️ Guía de Contribución

### Antes de Empezar

1. Fork el repositorio
2. Clone tu fork: `git clone https://github.com/tu-usuario/tfm-drones.git`
3. Agrega el upstream: `git remote add upstream https://github.com/AgustinHi/tfm-drones.git`
4. Crea una rama: `git checkout -b feature/descripcion`

### Desarrollo

#### Setup Local

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

#### Ejecutar Localmente

```bash
# Terminal 1 - Backend
cd backend && python -m uvicorn main:app --reload

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

#### Escribir Tests

- Backend: `pytest -v`
- Frontend: `npm run test`

```bash
# Ejemplo: Test nuevo en backend
# En test_auth.py:
def test_nuevo_feature(client):
    """Describir qué prueba este test"""
    response = client.post("/auth/login", json={...})
    assert response.status_code == 200
```

### Commitear Cambios

#### Formato de Mensaje

```
<type>(<scope>): <subject>

<body>

<footer>
```

##### Tipos
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Cambios en documentación
- `style`: Cambios que no afectan funcionalidad (espacios, comillas, etc.)
- `refactor`: Refactorización de código
- `perf`: Mejora de performance
- `test`: Agregar o actualizar tests
- `chore`: Cambios en build, dependencies, etc.

##### Ejemplos

```bash
# Feature
git commit -m "feat(auth): agregar autenticación de dos factores"

# Bug fix
git commit -m "fix(login): corregir validación de email duplicado"

# Documentation
git commit -m "docs(readme): actualizar instrucciones de instalación"

# Refactor
git commit -m "refactor(backend): separar lógica de autenticación"

# Tests
git commit -m "test(auth): agregar tests para registro de usuario"
```

### Push y Pull Request

```bash
# Actualizar rama desde upstream
git fetch upstream
git rebase upstream/main

# Push a tu fork
git push origin feature/descripcion

# Crear PR en GitHub
# Asegúrate de:
# - Tener descripción clara del cambio
# - Referenciar issues relacionados (#123)
# - Screenshots si aplica
# - Tests que pasen (21/21 backend, lint frontend)
```

### Checklist Pre-PR

- [ ] Código sigue style guide (PEP 8 backend, ESLint frontend)
- [ ] Tests pasan localmente
- [ ] Documentation actualizada
- [ ] No hay conflictos con main
- [ ] Commits son atómicos y descriptivos
- [ ] Sin secrets hardcodeados
- [ ] Performance aceptable

---

## 📋 Reportar Bugs

Usa GitHub Issues con el template:

```markdown
## Descripción del Bug
[Describir el comportamiento erróneo]

## Comportamiento Esperado
[Describir qué debería suceder]

## Pasos para Reproducir
1. [Primer paso]
2. [Segundo paso]
3. ...

## Información del Sistema
- OS: [Windows/Mac/Linux]
- Python: 3.11+
- Node: 18+

## Logs/Screenshots
[Adjuntar si aplica]
```

---

## 💡 Sugerir Features

Crea un GitHub Issue con:

```markdown
## Descripción
[Descripción clara de la feature]

## Caso de Uso
[Por qué es útil/necesaria]

## Solución Propuesta
[Cómo podrías implementarla]

## Alternativas Consideradas
[Otros enfoques]
```

---

## 📖 Estilo de Código

### Backend (Python)

```python
# ✅ Bueno
def register_user(email: str, password: str) -> Dict[str, Any]:
    """
    Registra un nuevo usuario.
    
    Args:
        email: Email del usuario
        password: Contraseña cifrada
        
    Returns:
        Dict con usuario creado
        
    Raises:
        HTTPException: Si el email ya existe
    """
    # implementation
    pass

# ❌ Malo
def reg_user(email, pwd):
    # no hay docstring
    # parámetros sin type hints
    pass
```

### Frontend (JavaScript/React)

```javascript
// ✅ Bueno
const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user data
  }, [userId]);
  
  return <div>{user?.name}</div>;
};

// ❌ Malo
const UP = (p) => {
  const [u, setU] = useState(null);
  // ... no comments
  return <div>{u?.name}</div>;
};
```

---

## 🚀 Proceso de Review

1. **Automated Checks**
   - Tests deben pasar
   - Linting debe pasar
   - Code coverage no debe bajar

2. **Code Review**
   - Mínimo 1 aprobación requerida
   - Feedback constructivo
   - Discusión abierta

3. **Merge**
   - Squash commits si es necesario
   - Merge a main
   - Delete branch

---

## 📚 Recursos

- [Python Style Guide (PEP 8)](https://www.python.org/dev/peps/pep-0008/)
- [React Best Practices](https://react.dev/learn)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## ❓ Preguntas?

- 📧 Email: agustin@example.com
- 💬 GitHub Discussions: [Link]
- 🐦 Twitter: [@AgustinHi](https://twitter.com/AgustinHi)

---

**¡Gracias por contribuir a DronHangar! 🚁**

