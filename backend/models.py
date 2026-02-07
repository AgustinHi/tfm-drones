from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Integer, Text

class Base(DeclarativeBase):
    pass

class Drone(Base):
    __tablename__ = "drones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(80), nullable=False)
    drone_type: Mapped[str] = mapped_column(String(50), nullable=False)  # FPV, Cinewhoop, etc.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
