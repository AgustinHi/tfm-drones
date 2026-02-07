from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import engine
from models import Drone

app = FastAPI(title="TFM Drones API")


class DroneCreate(BaseModel):
    brand: str
    model: str
    drone_type: str
    notes: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/drones")
def list_drones():
    with Session(engine) as session:
        drones = session.scalars(select(Drone)).all()
        return [
            {
                "id": d.id,
                "brand": d.brand,
                "model": d.model,
                "drone_type": d.drone_type,
                "notes": d.notes,
            }
            for d in drones
        ]


@app.post("/drones")
def create_drone(payload: DroneCreate):
    with Session(engine) as session:
        d = Drone(
            brand=payload.brand,
            model=payload.model,
            drone_type=payload.drone_type,
            notes=payload.notes,
        )
        session.add(d)
        session.commit()
        session.refresh(d)
        return {
            "id": d.id,
            "brand": d.brand,
            "model": d.model,
            "drone_type": d.drone_type,
            "notes": d.notes,
        }

@app.get("/drones/{drone_id}")
def get_drone(drone_id: int):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            return {"error": "not found"}
        return {
            "id": d.id,
            "brand": d.brand,
            "model": d.model,
            "drone_type": d.drone_type,
            "notes": d.notes,
        }

@app.delete("/drones/{drone_id}")
def delete_drone(drone_id: int):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            return {"error": "not found"}
        session.delete(d)
        session.commit()
        return {"deleted": drone_id}

class DroneUpdate(BaseModel):
    brand: str
    model: str
    drone_type: str
    notes: str | None = None

@app.put("/drones/{drone_id}")
def update_drone(drone_id: int, payload: DroneUpdate):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None:
            return {"error": "not found"}
        d.brand = payload.brand
        d.model = payload.model
        d.drone_type = payload.drone_type
        d.notes = payload.notes
        session.commit()
        session.refresh(d)
        return {
            "id": d.id,
            "brand": d.brand,
            "model": d.model,
            "drone_type": d.drone_type,
            "notes": d.notes,
        }
