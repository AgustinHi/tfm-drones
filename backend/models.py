from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import declarative_base
from sqlalchemy import Enum as SAEnum

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
