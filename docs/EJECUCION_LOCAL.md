# Ejecución en local (Windows)

## Requisitos
- XAMPP (MySQL)
- Node.js + npm
- Python
- Git

---

## 1) Arrancar MySQL (XAMPP)
1) Abrir **XAMPP Control Panel**
2) Pulsar **Start** en **MySQL** (debe quedar en verde)

---

## 2) Backend (FastAPI)
Abrir una terminal en la raíz del proyecto y ejecutar:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
