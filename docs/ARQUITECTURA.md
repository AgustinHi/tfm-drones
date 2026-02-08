# Arquitectura (MVP)

## Componentes
- Frontend (React + Vite + Tailwind)
- Backend (FastAPI)
- Base de datos (MySQL / MariaDB)

## Flujo
Frontend (http://localhost:5173)
  → llama a API REST
Backend (http://127.0.0.1:8000)
  → persiste datos en MySQL (tfm_drones)

## Puertos
- Frontend: 5173
- Backend: 8000
- MySQL: 3306

## Endpoints API
- GET /health
- GET /drones
- GET /drones/{id}
- POST /drones
- PUT /drones/{id}
- DELETE /drones/{id}
