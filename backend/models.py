from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Enum as SAEnum
from sqlalchemy.sql import func

Base = declarative_base()


class Drone(Base):
    __tablename__ = "drones"

    id = Column(Integer, primary_key=True, index=True)

    # Campos “tarjeta”
    name = Column(String(120), nullable=False, default="")
    comment = Column(String(255), nullable=True)

    # Campos seleccionables / rellenables
    controller = Column(SAEnum("Betaflight", "Kiss"), nullable=True)
    video = Column(SAEnum("Analogico", "Digital"), nullable=True)
    radio = Column(String(120), nullable=True)
    components = Column(Text, nullable=True)

    # Campos antiguos (siguen en la tabla)
    brand = Column(String(50), nullable=False)
    model = Column(String(80), nullable=False)
    drone_type = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    dumps = relationship("DroneDump", back_populates="drone", cascade="all, delete-orphan")


class DroneDump(Base):
    __tablename__ = "drone_dumps"

    id = Column(Integer, primary_key=True, index=True)
    drone_id = Column(Integer, ForeignKey("drones.id", ondelete="CASCADE"), nullable=False, index=True)

    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    bytes = Column(Integer, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())

    drone = relationship("Drone", back_populates="dumps")
