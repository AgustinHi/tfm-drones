from pathlib import Path
from uuid import uuid4

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Response,
    UploadFile,
    File,
    Form,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth_routes import get_current_user_email, router as auth_router
from db import engine, create_tables
from models import Drone, DroneDump

app = FastAPI(title="TFM Drones API")

create_tables()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
DUMPS_DIR = UPLOADS_DIR / "dumps"
DUMPS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_DUMP_EXTS = {".sql", ".dump", ".gz", ".zip", ".txt"}


class DroneCreate(BaseModel):
    name: str
    comment: str | None = None

    controller: str | None = None  # Betaflight | Kiss
    video: str | None = None       # Analogico | Digital
    radio: str | None = None
    components: str | None = None

    brand: str | None = ""
    model: str | None = ""
    drone_type: str | None = ""
    notes: str | None = None


class DroneUpdate(DroneCreate):
    pass


def drone_to_dict(d: Drone) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "comment": d.comment,
        "controller": d.controller,
        "video": d.video,
        "radio": d.radio,
        "components": d.components,
        "brand": d.brand,
        "model": d.model,
        "drone_type": d.drone_type,
        "notes": d.notes,
    }


def dump_to_dict(x: DroneDump) -> dict:
    return {
        "id": x.id,
        "drone_id": x.drone_id,
        "original_name": x.original_name,
        "stored_name": x.stored_name,
        "stored_path": x.stored_path,
        "bytes": x.bytes,
        "created_at": x.created_at.isoformat() if x.created_at else None,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/drones")
def list_drones(user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        drones = session.scalars(select(Drone)).all()
        return [drone_to_dict(d) for d in drones]


@app.get("/drones/{drone_id}")
def get_drone(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")
        return drone_to_dict(d)


@app.get("/drones/{drone_id}/dumps")
def list_drone_dumps(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        dumps = session.scalars(
            select(DroneDump).where(DroneDump.drone_id == drone_id).order_by(DroneDump.id.desc())
        ).all()
        return [dump_to_dict(x) for x in dumps]


@app.post("/drones", status_code=status.HTTP_201_CREATED)
def create_drone(payload: DroneCreate, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = Drone(
            name=payload.name,
            comment=payload.comment,
            controller=payload.controller,
            video=payload.video,
            radio=payload.radio,
            components=payload.components,
            brand=payload.brand or "",
            model=payload.model or "",
            drone_type=payload.drone_type or "",
            notes=payload.notes,
        )
        session.add(d)
        session.commit()
        session.refresh(d)
        return drone_to_dict(d)


@app.put("/drones/{drone_id}")
def update_drone(drone_id: int, payload: DroneUpdate, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        d.name = payload.name
        d.comment = payload.comment
        d.controller = payload.controller
        d.video = payload.video
        d.radio = payload.radio
        d.components = payload.components

        d.brand = payload.brand or ""
        d.model = payload.model or ""
        d.drone_type = payload.drone_type or ""
        d.notes = payload.notes

        session.commit()
        session.refresh(d)
        return drone_to_dict(d)


@app.delete("/drones/{drone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_drone(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        session.delete(d)
        session.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/dumps", status_code=status.HTTP_201_CREATED)
async def upload_dump(
    drone_id: int = Form(...),
    file: UploadFile = File(...),
    user_email: str = Depends(get_current_user_email),
):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        original_name = file.filename or "upload.bin"
        ext = Path(original_name).suffix.lower()

        if ext not in ALLOWED_DUMP_EXTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension: {ext}",
            )

        safe_original = Path(original_name).name
        stored_name = f"{uuid4().hex}_{safe_original}"

        drone_dir = DUMPS_DIR / f"drone_{drone_id}"
        drone_dir.mkdir(parents=True, exist_ok=True)

        dest_path = drone_dir / stored_name

        size = 0
        try:
            with dest_path.open("wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
                    size += len(chunk)
        finally:
            await file.close()

        stored_path = str(dest_path.relative_to(BASE_DIR)).replace("\\", "/")

        dump = DroneDump(
            drone_id=drone_id,
            original_name=safe_original,
            stored_name=stored_name,
            stored_path=stored_path,
            bytes=size,
        )
        session.add(dump)
        session.commit()
        session.refresh(dump)

        return dump_to_dict(dump)
