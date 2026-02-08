# tfm-drones

Aplicación web MVP para gestionar drones (CRUD básico).

## Stack
- Backend: FastAPI + SQLAlchemy + MySQL (MariaDB)
- Frontend: Vite + React + Tailwind
- Repo: GitHub

## Estructura del proyecto
- `backend/` API FastAPI + conexión a MySQL
- `frontend/` app React (Vite) + Tailwind
- `docs/` documentación del proyecto (arquitectura, BD, ejecución local)
- `slides/` slides (documento de presentación)

## Documentación
- Docs: `docs/`
- Slides: `slides/SLIDES.md`

## Ejecución en local (Windows)

### 1) MySQL (XAMPP)
- Abrir XAMPP Control Panel
- Start en MySQL (debe quedar en verde)

### 2) Backend (FastAPI)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
