import pytest
from sqlalchemy.orm import Session
from user_models import User
from models import Drone, DroneDump
from auth import hash_password


class TestUserModel:
    """Tests para modelo User"""

    def test_user_creation(self, db: Session):
        """Test creación de usuario"""
        user = User(
            email="test@example.com",
            password_hash=hash_password("testpass"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.password_hash is not None

    def test_user_unique_email(self, db: Session):
        """Test que email es único"""
        user1 = User(
            email="unique@example.com",
            password_hash=hash_password("pass1"),
        )
        user2 = User(
            email="unique@example.com",
            password_hash=hash_password("pass2"),
        )
        db.add(user1)
        db.commit()

        db.add(user2)
        with pytest.raises(Exception):  # IntegrityError
            db.commit()


class TestDroneModel:
    """Tests para modelo Drone"""

    @pytest.fixture
    def drone_data(self):
        return {
            "owner_email": "user@example.com",
            "name": "My FPV Drone",
            "comment": "Racing drone",
            "controller": "Betaflight",
            "video": "Digital",
            "radio": "ExpressLRS",
            "components": "Components data",
            "brand": "CustomBuild",
            "model": "5inch",
            "drone_type": "FPV",
            "notes": "Some notes",
        }

    def test_drone_creation(self, db: Session, drone_data):
        """Test creación de dron"""
        drone = Drone(**drone_data)
        db.add(drone)
        db.commit()
        db.refresh(drone)

        assert drone.id is not None
        assert drone.name == "My FPV Drone"
        assert drone.owner_email == "user@example.com"
        assert drone.controller == "Betaflight"

    def test_drone_optional_fields(self, db: Session):
        """Test campos opcionalesv de dron"""
        drone = Drone(
            owner_email="user@example.com",
            name="Simple Drone",
            brand="DJI",
            model="Mini",
            drone_type="Quadcopter",
        )
        db.add(drone)
        db.commit()
        db.refresh(drone)

        assert drone.comment is None
        assert drone.controller is None
        assert drone.radio is None

    def test_drone_with_dumps(self, db: Session, drone_data):
        """Test dron con dumps asociados"""
        drone = Drone(**drone_data)
        db.add(drone)
        db.flush()

        dump1 = DroneDump(
            drone_id=drone.id,
            original_name="dump1.txt",
            stored_name="stored1.txt",
            stored_path="/dumps/stored1.txt",
            bytes=1024,
        )
        dump2 = DroneDump(
            drone_id=drone.id,
            original_name="dump2.txt",
            stored_name="stored2.txt",
            stored_path="/dumps/stored2.txt",
            bytes=2048,
        )
        db.add(dump1)
        db.add(dump2)
        db.commit()
        db.refresh(drone)

        assert len(drone.dumps) == 2
        assert drone.dumps[0].original_name == "dump1.txt"


class TestDroneDumpModel:
    """Tests para modelo DroneDump"""

    def test_dump_creation(self, db: Session, drone_data):
        """Test creación de dump"""
        drone = Drone(**drone_data)
        db.add(drone)
        db.flush()

        dump = DroneDump(
            drone_id=drone.id,
            original_name="test_dump.bin",
            stored_name="stored_dump.bin",
            stored_path="/uploads/dumps/stored_dump.bin",
            bytes=5120,
        )
        db.add(dump)
        db.commit()
        db.refresh(dump)

        assert dump.id is not None
        assert dump.original_name == "test_dump.bin"
        assert dump.bytes == 5120
        assert dump.is_public is False  # Default

    def test_dump_cascade_delete(self, db: Session, drone_data):
        """Test que eliminar dron elimina sus dumps"""
        drone = Drone(**drone_data)
        db.add(drone)
        db.flush()

        dump = DroneDump(
            drone_id=drone.id,
            original_name="test_dump.bin",
            stored_name="stored_dump.bin",
            stored_path="/uploads/dumps/stored_dump.bin",
            bytes=5120,
        )
        db.add(dump)
        db.commit()

        # Eliminar dron
        db.delete(drone)
        db.commit()

        # Verificar que dump fue eliminado
        remaining_dumps = db.query(DroneDump).all()
        assert len(remaining_dumps) == 0


@pytest.fixture
def drone_data():
    return {
        "owner_email": "user@example.com",
        "name": "My FPV Drone",
        "comment": "Racing drone",
        "controller": "Betaflight",
        "video": "Digital",
        "radio": "ExpressLRS",
        "components": "Components data",
        "brand": "CustomBuild",
        "model": "5inch",
        "drone_type": "FPV",
        "notes": "Some notes",
    }
