# backend/main.py
from pathlib import Path
from uuid import uuid4
import io
import gzip
import zipfile

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


def _safe_resolve_inside_base(p: Path) -> Path:
    base = BASE_DIR.resolve()
    rp = p.resolve()
    if base != rp and base not in rp.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored path")
    return rp


def _read_dump_payload_bytes(file_path: Path, ext: str) -> bytes:
    raw = file_path.read_bytes()

    if ext == ".gz":
        try:
            return gzip.decompress(raw)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid .gz dump (cannot decompress): {e}",
            )

    if ext == ".zip":
        try:
            with zipfile.ZipFile(io.BytesIO(raw)) as z:
                members = [m for m in z.infolist() if not m.is_dir()]
                if not members:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Empty .zip dump (no files inside)",
                    )

                def score(m: zipfile.ZipInfo):
                    name = (m.filename or "").lower()
                    # Prefer typical CLI/diff text-like files first
                    preferred = name.endswith((".txt", ".dump", ".cli", ".cfg", ".diff", ".config"))
                    pri = 0 if preferred else 10
                    return (pri, -int(getattr(m, "file_size", 0) or 0), name)

                members.sort(key=score)
                pick = members[0]
                with z.open(pick) as f:
                    return f.read()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid .zip dump (cannot read): {e}",
            )

    return raw


def _decode_dump_text(data: bytes) -> str:
    for enc in ("utf-8", "utf-16", "latin-1"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")


def _group_setting_key(key: str) -> str:
    k = (key or "").strip().lower()

    # OSD
    if k.startswith("osd") or "osd" in k or k.startswith("displayport"):
        return "osd"

    # VTX / video transmitters
    if k.startswith(("vtx", "vtx_", "vcd_", "tramp", "smartaudio")) or "vtx" in k:
        return "vtx"

    # Receiver / radio
    if k.startswith(("rx_", "serialrx", "crsf", "elrs", "expresslrs", "sbus", "spektrum")) or "receiver" in k:
        return "rx"

    # PID-ish / filters / controller
    if (
        k.startswith(("p_", "i_", "d_", "ff_"))
        or "pid" in k
        or k.startswith(("iterm", "dterm", "pterm"))
        or "gyro" in k
        or "filter" in k
        or "dshot" in k
    ):
        return "pid"

    # Rates
    if "rate" in k or "expo" in k or k.startswith(("rc_", "rates_", "throttle_", "roll_rate", "pitch_rate", "yaw_rate")):
        return "rates"

    # Ports / serial / peripherals
    if k.startswith(("serial_", "uart", "gps_", "baro", "mag", "i2c", "spi", "softserial")):
        return "ports"

    return "misc"


def parse_betaflight_like(text: str) -> dict:
    """
    Parser "best-effort" para dumps tipo Betaflight CLI/diff.
    Objetivo: devolver un JSON por secciones que luego el frontend puede pintar estilo Betaflight Configurator.

    Nota: no replica al 100% el configurador (eso se afina iterando), pero:
    - extrae firmware/meta si aparece
    - extrae 'set key = value'
    - mantiene comandos estructurales (profile/rateprofile/serial/resource/feature/aux)
    - agrupa settings por categorías (pid/rates/osd/vtx/rx/ports/misc)
    """
    lines = text.splitlines()

    firmware: dict = {}
    features_enabled: list[str] = []
    features_disabled: list[str] = []
    serial_lines: list[str] = []
    resource_lines: list[str] = []
    aux_lines: list[str] = []
    other_cmds: list[str] = []

    global_settings: dict[str, str] = {}

    # Per-profile buckets
    current_profile = "0"
    current_rateprofile = "0"

    profile_settings: dict[str, dict[str, dict[str, str]]] = {}       # profile -> group -> {k:v}
    rateprofile_settings: dict[str, dict[str, dict[str, str]]] = {}   # rateprofile -> group -> {k:v}

    def ensure_profile(p: str):
        if p not in profile_settings:
            profile_settings[p] = {"pid": {}, "rates": {}, "osd": {}, "vtx": {}, "rx": {}, "ports": {}, "misc": {}}

    def ensure_rateprofile(p: str):
        if p not in rateprofile_settings:
            rateprofile_settings[p] = {"pid": {}, "rates": {}, "osd": {}, "vtx": {}, "rx": {}, "ports": {}, "misc": {}}

    ensure_profile(current_profile)
    ensure_rateprofile(current_rateprofile)

    recognized = 0
    unknown = 0

    for raw in lines:
        s = (raw or "").strip()
        if not s:
            continue
        if s.startswith("#"):
            continue

        low = s.lower()

        # Header-ish
        if low.startswith("version"):
            firmware["version_line"] = s
            recognized += 1
            continue
        if low.startswith("board_name"):
            parts = s.split(maxsplit=1)
            firmware["board_name"] = parts[1].strip() if len(parts) > 1 else ""
            recognized += 1
            continue
        if low.startswith("manufacturer_id"):
            parts = s.split(maxsplit=1)
            firmware["manufacturer_id"] = parts[1].strip() if len(parts) > 1 else ""
            recognized += 1
            continue
        if low.startswith("name"):
            # CLI: name <string>
            parts = s.split(maxsplit=1)
            firmware["fc_name"] = parts[1].strip() if len(parts) > 1 else ""
            recognized += 1
            continue

        # Profile switches
        if low.startswith("profile "):
            parts = s.split()
            if len(parts) >= 2 and parts[1].isdigit():
                current_profile = parts[1]
                ensure_profile(current_profile)
            else:
                current_profile = parts[1] if len(parts) >= 2 else "0"
                ensure_profile(current_profile)
            recognized += 1
            continue

        if low.startswith("rateprofile "):
            parts = s.split()
            if len(parts) >= 2 and parts[1].isdigit():
                current_rateprofile = parts[1]
                ensure_rateprofile(current_rateprofile)
            else:
                current_rateprofile = parts[1] if len(parts) >= 2 else "0"
                ensure_rateprofile(current_rateprofile)
            recognized += 1
            continue

        # Set lines
        if low.startswith("set "):
            body = s[4:].strip()
            if "=" in body:
                k, v = body.split("=", 1)
                k = k.strip()
                v = v.strip()
                if k:
                    grp = _group_setting_key(k)

                    # Guardamos global SIEMPRE (para tener un mapa completo)
                    global_settings[k] = v

                    # Además, colocamos en bucket contextual:
                    # - pid -> profile
                    # - rates -> rateprofile
                    # - resto -> profile (por simplicidad) y rateprofile también si quieres “vista completa”
                    if grp == "pid":
                        ensure_profile(current_profile)
                        profile_settings[current_profile][grp][k] = v
                    elif grp == "rates":
                        ensure_rateprofile(current_rateprofile)
                        rateprofile_settings[current_rateprofile][grp][k] = v
                    else:
                        ensure_profile(current_profile)
                        profile_settings[current_profile][grp][k] = v

                    recognized += 1
                    continue

            # Si no cumple el formato, lo dejamos como comando “other”
            other_cmds.append(s)
            unknown += 1
            continue

        # Serial / resource / aux / feature commands
        if low.startswith("serial "):
            serial_lines.append(s)
            recognized += 1
            continue

        if low.startswith("resource "):
            resource_lines.append(s)
            recognized += 1
            continue

        if low.startswith("aux "):
            aux_lines.append(s)
            recognized += 1
            continue

        if low.startswith("feature "):
            # feature GPS / feature -GPS
            tok = s.split(maxsplit=1)
            feat = tok[1].strip() if len(tok) > 1 else ""
            if feat.startswith("-"):
                features_disabled.append(feat[1:].strip())
            elif feat:
                features_enabled.append(feat)
            recognized += 1
            continue

        # “diff all” / “dump all” headers etc.
        if low in ("diff all", "dump all") or low.startswith("diff ") or low.startswith("dump "):
            recognized += 1
            continue

        # Fallthrough
        other_cmds.append(s)
        unknown += 1

    warnings: list[str] = []
    if "version_line" not in firmware:
        warnings.append("No 'version' line found in dump (may not be a Betaflight CLI/diff dump).")

    return {
        "firmware": firmware,
        "features": {"enabled": sorted(set(features_enabled)), "disabled": sorted(set(features_disabled))},
        "ports": {"serial": serial_lines},
        "resources": resource_lines,
        "modes": {"aux": aux_lines},
        "settings": {
            "global": global_settings,
            "profiles": profile_settings,
            "rateprofiles": rateprofile_settings,
        },
        "other_commands": other_cmds[:800],  # límite defensivo
        "warnings": warnings,
        "stats": {
            "lines_total": len(lines),
            "recognized": recognized,
            "unknown": unknown,
            "profiles_detected": sorted(profile_settings.keys(), key=lambda x: int(x) if str(x).isdigit() else 9999),
            "rateprofiles_detected": sorted(rateprofile_settings.keys(), key=lambda x: int(x) if str(x).isdigit() else 9999),
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/drones")
def list_drones(user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        drones = session.scalars(
            select(Drone).where(Drone.owner_email == user_email).order_by(Drone.id.desc())
        ).all()
        return [drone_to_dict(d) for d in drones]


@app.get("/drones/{drone_id}")
def get_drone(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None or d.owner_email != user_email:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")
        return drone_to_dict(d)


@app.get("/drones/{drone_id}/dumps")
def list_drone_dumps(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None or d.owner_email != user_email:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        dumps = session.scalars(
            select(DroneDump).where(DroneDump.drone_id == drone_id).order_by(DroneDump.id.desc())
        ).all()
        return [dump_to_dict(x) for x in dumps]


@app.post("/drones", status_code=status.HTTP_201_CREATED)
def create_drone(payload: DroneCreate, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        d = Drone(
            owner_email=user_email,
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
        if d is None or d.owner_email != user_email:
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
        if d is None or d.owner_email != user_email:
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
        if d is None or d.owner_email != user_email:
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


@app.get("/drones/{drone_id}/dumps/{dump_id}/parse")
def parse_dump(
    drone_id: int,
    dump_id: int,
    user_email: str = Depends(get_current_user_email),
):
    with Session(engine) as session:
        d = session.get(Drone, drone_id)
        if d is None or d.owner_email != user_email:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")

        dump = session.get(DroneDump, dump_id)
        if dump is None or dump.drone_id != drone_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dump not found")

        stored_path = (dump.stored_path or "").strip()
        if not stored_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dump file path not found")

        file_path = BASE_DIR / stored_path
        file_path = _safe_resolve_inside_base(file_path)

        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dump file not found on disk")

        ext = file_path.suffix.lower()
        if ext not in ALLOWED_DUMP_EXTS:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file extension: {ext}")

        payload = _read_dump_payload_bytes(file_path, ext)
        text = _decode_dump_text(payload)

        parsed = parse_betaflight_like(text)

        return {
            "drone": drone_to_dict(d),
            "dump": dump_to_dict(dump),
            "parsed": parsed,
        }
