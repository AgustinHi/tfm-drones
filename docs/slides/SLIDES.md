# TFM Drones (MVP)

## 1) Qué es
Aplicación web para gestionar drones (CRUD básico).

## 2) Objetivo
- Alta, listado, edición y borrado de drones.
- Persistencia en base de datos.

## 3) Stack
- Backend: FastAPI + SQLAlchemy + MySQL
- Frontend: Vite + React + Tailwind
- Repo: GitHub

## 4) Funcionalidades (MVP)
- Listar drones
- Crear drone
- Editar drone
- Borrar drone

## 5) Arquitectura
- Frontend (5173) → API (8000) → MySQL

## 6) Demo
- Mostrar listado
- Crear drone
- Editar drone
- Borrar drone

## 7) Cómo ejecutar
Backend:
- MySQL en marcha (XAMPP)
- `cd backend`
- activar venv
- `python -m pip install -r requirements.txt`
- `uvicorn main:app --reload --port 8000`

Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`

## 8) Próximos pasos
- Validaciones
- Filtros/búsqueda
- Autenticación (opcional)
- Despliegue
