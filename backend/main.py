# backend/main.py
from pathlib import Path
from uuid import uuid4
import io
import gzip
import zipfile
import shutil

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

# Límites defensivos (evita zip/gzip bombs y ficheros enormes)
MAX_DUMP_UPLOAD_BYTES = 20 * 1024 * 1024        # 20 MB (bytes escritos al disco)
MAX_DUMP_DECOMPRESSED_BYTES = 20 * 1024 * 1024  # 20 MB (bytes tras descomprimir)


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


def _get_owned_drone(session: Session, drone_id: int, user_email: str) -> Drone:
    d = session.get(Drone, drone_id)
    if d is None or d.owner_email != user_email:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drone not found")
    return d


def _safe_resolve_inside_base(p: Path) -> Path:
    base = BASE_DIR.resolve()
    rp = p.resolve()
    if base != rp and base not in rp.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid stored path")
    return rp


def _safe_remove_drone_dump_dir(drone_id: int) -> None:
    """
    Borra la carpeta uploads/dumps/drone_{id} (si existe).
    Best-effort: si falla, no rompe el DELETE del dron (evita dejar la API “bloqueada” por locks en Windows).
    """
    base = DUMPS_DIR.resolve()
    target = (DUMPS_DIR / f"drone_{drone_id}").resolve()

    if target.name != f"drone_{drone_id}":
        return
    if base != target and base not in target.parents:
        return
    if not target.exists() or not target.is_dir():
        return

    try:
        shutil.rmtree(target)
    except Exception:
        pass


def _safe_remove_single_dump_file(drone_id: int, stored_path: str) -> None:
    """
    Borra el fichero de un dump concreto, validando que el path está dentro de BASE_DIR.
    Además, si el directorio drone_{id} queda vacío, lo elimina (best-effort).
    Reglas:
    - Si el fichero NO existe: no falla (lo tratamos como ya borrado).
    - Si existe y no se puede borrar: lanza 500 y NO se debe borrar el registro en BD.
    """
    sp = (stored_path or "").strip()
    if not sp:
        # No hay path: no podemos tocar disco, pero tampoco queremos romper.
        return

    file_path = _safe_resolve_inside_base(BASE_DIR / sp)

    if file_path.exists():
        try:
            if not file_path.is_file():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dump file path")
            file_path.unlink()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cannot delete dump file: {e}",
            )

    # Limpieza del directorio drone_{id} si queda vacío (best-effort)
    try:
        base = DUMPS_DIR.resolve()
        expected_dir = (DUMPS_DIR / f"drone_{drone_id}").resolve()
        if expected_dir.exists() and expected_dir.is_dir():
            if base == expected_dir or base in expected_dir.parents:
                if expected_dir.name == f"drone_{drone_id}":
                    if not any(expected_dir.iterdir()):
                        expected_dir.rmdir()
    except Exception:
        pass


def _enforce_max_bytes(data_len: int, limit: int, what: str):
    if data_len > limit:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"{what} too large (>{limit} bytes)",
        )


def _gunzip_with_limit(raw: bytes, limit: int) -> bytes:
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(raw)) as gz:
            out = gz.read(limit + 1)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid .gz dump (cannot decompress): {e}",
        )
    _enforce_max_bytes(len(out), limit, "Decompressed dump")
    return out


def _read_dump_payload_bytes(file_path: Path, ext: str) -> bytes:
    raw = file_path.read_bytes()
    _enforce_max_bytes(len(raw), MAX_DUMP_UPLOAD_BYTES, "Dump file")

    if ext == ".gz":
        return _gunzip_with_limit(raw, MAX_DUMP_DECOMPRESSED_BYTES)

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
                    preferred = name.endswith((".txt", ".dump", ".cli", ".cfg", ".diff", ".config"))
                    pri = 0 if preferred else 10
                    return (pri, -int(getattr(m, "file_size", 0) or 0), name)

                members.sort(key=score)
                pick = members[0]

                file_size = int(getattr(pick, "file_size", 0) or 0)
                _enforce_max_bytes(file_size, MAX_DUMP_DECOMPRESSED_BYTES, "Decompressed dump")

                with z.open(pick) as f:
                    data = f.read(MAX_DUMP_DECOMPRESSED_BYTES + 1)

                _enforce_max_bytes(len(data), MAX_DUMP_DECOMPRESSED_BYTES, "Decompressed dump")
                return data
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid .zip dump (cannot read): {e}",
            )

    _enforce_max_bytes(len(raw), MAX_DUMP_DECOMPRESSED_BYTES, "Dump payload")
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

    if k.startswith("osd") or "osd" in k or k.startswith("displayport"):
        return "osd"

    if k.startswith(("vtx", "vtx_", "vcd_", "tramp", "smartaudio")) or "vtx" in k:
        return "vtx"

    if k.startswith(("rx_", "serialrx", "crsf", "elrs", "expresslrs", "sbus", "spektrum")) or "receiver" in k:
        return "rx"

    if (
        k.startswith(("p_", "i_", "d_", "ff_"))
        or "pid" in k
        or k.startswith(("iterm", "dterm", "pterm"))
        or "gyro" in k
        or "filter" in k
        or "dshot" in k
    ):
        return "pid"

    if "rate" in k or "expo" in k or k.startswith(("rc_", "rates_", "throttle_", "roll_rate", "pitch_rate", "yaw_rate")):
        return "rates"

    if k.startswith(("serial_", "uart", "gps_", "baro", "mag", "i2c", "spi", "softserial")):
        return "ports"

    return "misc"


def parse_betaflight_like(text: str) -> dict:
    lines = text.splitlines()

    firmware: dict = {}
    features_enabled: list[str] = []
    features_disabled: list[str] = []
    serial_lines: list[str] = []
    resource_lines: list[str] = []
    aux_lines: list[str] = []
    other_cmds: list[str] = []

    global_settings: dict[str, str] = {}

    current_profile = "0"
    current_rateprofile = "0"

    profile_settings: dict[str, dict[str, dict[str, str]]] = {}
    rateprofile_settings: dict[str, dict[str, dict[str, str]]] = {}

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
            parts = s.split(maxsplit=1)
            firmware["fc_name"] = parts[1].strip() if len(parts) > 1 else ""
            recognized += 1
            continue

        if low.startswith("profile "):
            parts = s.split()
            current_profile = parts[1] if len(parts) >= 2 else "0"
            ensure_profile(current_profile)
            recognized += 1
            continue

        if low.startswith("rateprofile "):
            parts = s.split()
            current_rateprofile = parts[1] if len(parts) >= 2 else "0"
            ensure_rateprofile(current_rateprofile)
            recognized += 1
            continue

        if low.startswith("set "):
            body = s[4:].strip()
            if "=" in body:
                k, v = body.split("=", 1)
                k = k.strip()
                v = v.strip()
                if k:
                    grp = _group_setting_key(k)
                    global_settings[k] = v

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

            other_cmds.append(s)
            unknown += 1
            continue

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
            tok = s.split(maxsplit=1)
            feat = tok[1].strip() if len(tok) > 1 else ""
            if feat.startswith("-"):
                features_disabled.append(feat[1:].strip())
            elif feat:
                features_enabled.append(feat)
            recognized += 1
            continue

        if low in ("diff all", "dump all") or low.startswith("diff ") or low.startswith("dump "):
            recognized += 1
            continue

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
        "other_commands": other_cmds[:800],
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
        d = _get_owned_drone(session, drone_id, user_email)
        return drone_to_dict(d)


@app.get("/drones/{drone_id}/dumps")
def list_drone_dumps(drone_id: int, user_email: str = Depends(get_current_user_email)):
    with Session(engine) as session:
        _get_owned_drone(session, drone_id, user_email)

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
        d = _get_owned_drone(session, drone_id, user_email)

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
        d = _get_owned_drone(session, drone_id, user_email)

        session.delete(d)
        session.commit()

    _safe_remove_drone_dump_dir(drone_id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/dumps", status_code=status.HTTP_201_CREATED)
async def upload_dump(
    drone_id: int = Form(...),
    file: UploadFile = File(...),
    user_email: str = Depends(get_current_user_email),
):
    with Session(engine) as session:
        _get_owned_drone(session, drone_id, user_email)

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
                    size += len(chunk)
                    if size > MAX_DUMP_UPLOAD_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"Dump file too large (>{MAX_DUMP_UPLOAD_BYTES} bytes)",
                        )
                    f.write(chunk)
        except HTTPException:
            if dest_path.exists():
                try:
                    dest_path.unlink()
                except Exception:
                    pass
            raise
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


@app.delete("/drones/{drone_id}/dumps/{dump_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dump(
    drone_id: int,
    dump_id: int,
    user_email: str = Depends(get_current_user_email),
):
    with Session(engine) as session:
        _get_owned_drone(session, drone_id, user_email)

        dump = session.get(DroneDump, dump_id)
        if dump is None or dump.drone_id != drone_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dump not found")

        # 1) Borrar fichero (si falla, NO borramos BD)
        _safe_remove_single_dump_file(drone_id, dump.stored_path or "")

        # 2) Borrar registro BD
        session.delete(dump)
        session.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/drones/{drone_id}/dumps/{dump_id}/parse")
def parse_dump(
    drone_id: int,
    dump_id: int,
    user_email: str = Depends(get_current_user_email),
):
    with Session(engine) as session:
        d = _get_owned_drone(session, drone_id, user_email)

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
