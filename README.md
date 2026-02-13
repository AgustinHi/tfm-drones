# DronHangar (tfm-drones)

[![MIT License](https://img.shields.io/github/license/AgustinHi/tfm-drones?style=flat-square)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/AgustinHi/tfm-drones?style=flat-square)](https://github.com/AgustinHi/tfm-drones/commits/main)
[![Open issues](https://img.shields.io/github/issues/AgustinHi/tfm-drones?style=flat-square)](https://github.com/AgustinHi/tfm-drones/issues)

Web app para **gestionar drones** con **backend FastAPI + MySQL** y **frontend React (Vite)**. Incluye **autenticación JWT**, **CRUD de drones** y **subida/listado/parseo de dumps**.

---

## Contenido

- [DronHangar (tfm-drones)](#dronhangar-tfm-drones)
  - [Contenido](#contenido)
  - [Stack](#stack)
  - [Estructura del repositorio](#estructura-del-repositorio)
  - [Funciones principales](#funciones-principales)
    - [Autenticación (JWT)](#autenticación-jwt)
    - [Drones (por usuario)](#drones-por-usuario)
    - [Dumps por dron](#dumps-por-dron)
  - [Arranque en local](#arranque-en-local)
    - [Requisitos](#requisitos)
    - [1) Base de datos](#1-base-de-datos)

---

## Stack

- **Backend:** FastAPI + SQLAlchemy + PyMySQL
- **Auth:** JWT (PyJWT) + hashing PBKDF2 (passlib)
- **Frontend:** React + Vite + Tailwind
- **i18n:** ES/EN (react-i18next)

---

## Estructura del repositorio

- `backend/` → API FastAPI + modelos + auth JWT + gestión de dumps
- `frontend/` → App React (Vite) + UI + routing
- `docs/` → documentación del proyecto
- `slides/` → presentación (`slides/SLIDES.md`)

---

## Funciones principales

### Autenticación (JWT)
- Registro: `POST /auth/register`
- Login: `POST /auth/login` → devuelve `access_token`
- Sesión: `GET /auth/me`

### Drones (por usuario)
- Listado / detalle / creación / edición / borrado de drones.
- Los drones se filtran por el usuario autenticado (campo `owner_email` en BD).

### Dumps por dron
- Listado: `GET /drones/{drone_id}/dumps`
- Subida (multipart): `POST /dumps` (`drone_id` + `file`)
- Borrado: `DELETE /drones/{drone_id}/dumps/{dump_id}` (borra registro + fichero)
- Parseo: `GET /drones/{drone_id}/dumps/{dump_id}/parse` (formato “Betaflight-like”)

**Extensiones permitidas (upload):** `.sql`, `.dump`, `.gz`, `.zip`, `.txt`  
**Límites defensivos:** 20 MB (subida) y 20 MB (contenido descomprimido).

---

## Arranque en local

### Requisitos
- **MySQL/MariaDB** (por ejemplo XAMPP)
- **Python** (recomendado 3.11+)
- **Node.js** (recomendado 18+)

### 1) Base de datos

Crea una base de datos (ejemplo):

```sql
CREATE DATABASE tfm_drones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
