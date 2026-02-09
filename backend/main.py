from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth_routes import get_current_user_email, router as auth_router
from db import engine, create_tables
from models import Drone

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


class DroneCreate(BaseModel):
    # Tarjeta
    name: str
    comment: str | None = None

    # Selecciones / rellenables
    controller: str | None = None  # Betaflight | Kiss
    video: str | None = None       # Analogico | Digital
    radio: str | None = None
    components: str | None = None

    # Campos antiguos (compat)
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
        # antiguos
        "brand": d.brand,
        "model": d.model,
        "drone_type": d.drone_type,
        "notes": d.notes,
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

        # antiguos (compat)
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
