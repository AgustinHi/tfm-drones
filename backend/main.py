from fastapi import FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import select

from db import engine
from models import Drone

app = FastAPI(title="TFM Drones API")

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
