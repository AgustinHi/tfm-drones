# Base de datos (MVP)

## Nombre
`tfm_drones`

## Tabla: drones
Campos:
- id (INT, PK, autoincrement)
- brand (VARCHAR(50), NOT NULL)
- model (VARCHAR(80), NOT NULL)
- drone_type (VARCHAR(50), NOT NULL)
- notes (TEXT, NULL)

## Creación
La tabla se crea automáticamente desde SQLAlchemy al ejecutar:
- `python test_db.py`
