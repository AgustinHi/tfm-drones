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
from community_routes import router as community_router
from db import engine, create_tables
from models import Drone, DroneDump

app = FastAPI(title="TFM Drones API")

create_tables()
app.include_router(auth_router)
app.include_router(community_router)

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

    Best-effort: si falla, no rompe el DELETE del dron
    (evita dejar la API “bloqueada” por locks en Windows).
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

    fp = _safe_resolve_inside_base(BASE_DIR / sp)

    # Debe estar dentro de uploads/dumps/drone_{id}/...
    expected_dir = _safe_resolve_inside_base(DUMPS_DIR / f"drone_{drone_id}")
    if expected_dir != fp.parent and expected_dir not in fp.parents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dump stored path")

    if fp.exists():
        try:
            fp.unlink()
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete dump file")

    # Best-effort: si la carpeta se queda vacía, la quitamos
    try:
        if expected_dir.exists() and expected_dir.is_dir():
            if not any(expected_dir.iterdir()):
                expected_dir.rmdir()
    except Exception:
        pass


def _sanitize_filename(name: str) -> str:
    # Evita rutas y chars raros
    name = (name or "").strip().replace("\\", "/").split("/")[-1]
    # muy simple: quita NULL y controla longitud
    name = name.replace("\x00", "")
    return name[:200] if len(name) > 200 else name


def _read_limited(stream: io.BufferedReader, limit: int) -> bytes:
    # Lee hasta limit+1 para detectar overflow
    data = stream.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Dump too large")
    return data


def _decompress_gzip_limited(payload: bytes, limit: int) -> bytes:
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(payload), mode="rb") as gz:
            return _read_limited(gz, limit)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid gzip dump")


def _decompress_zip_limited(payload: bytes, limit: int) -> bytes:
    try:
        with zipfile.ZipFile(io.BytesIO(payload)) as zf:
            # Sólo 1 fichero dentro (defensivo)
            names = [n for n in zf.namelist() if not n.endswith("/")]
            if not names:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty zip dump")
            if len(names) > 1:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Zip with multiple files is not allowed")

            with zf.open(names[0]) as f:
                return _read_limited(f, limit)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid zip dump")


def _read_dump_payload_bytes(file_path: Path, ext: str) -> bytes:
    payload = file_path.read_bytes()

    # Si viene comprimido, lo descomprimimos limitado
    if ext == ".gz":
        return _decompress_gzip_limited(payload, MAX_DUMP_DECOMPRESSED_BYTES)
    if ext == ".zip":
        return _decompress_zip_limited(payload, MAX_DUMP_DECOMPRESSED_BYTES)

    # .sql/.dump/.txt → tal cual (pero limitado a MAX_DUMP_DECOMPRESSED_BYTES)
    if len(payload) > MAX_DUMP_DECOMPRESSED_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Dump too large")
    return payload


def _decode_dump_text(payload: bytes) -> str:
    # Intenta UTF-8; si falla, latin-1 (mucha gente guarda así)
    try:
        return payload.decode("utf-8", errors="replace")
    except Exception:
        return payload.decode("latin-1", errors="replace")


def parse_betaflight_like(text: str) -> dict:
    """
    Parser “Betaflight-like” defensivo:
    - detecta líneas típicas: '# version', '# resources', 'resource', 'set', 'profile', 'rateprofile', 'aux'
    - agrupa por secciones
    """
    lines = (text or "").splitlines()

    version = None
    board = None
    build = None

    resource_lines: list[str] = []
    aux_lines: list[str] = []
    global_settings: list[str] = []
    profile_settings: dict[str, list[str]] = {}
    rateprofile_settings: dict[str, list[str]] = {}
    other_cmds: list[str] = []
    warnings: list[str] = []

    current_profile = None
    current_rateprofile = None

    recognized = 0
    unknown = 0

    for raw in lines:
        line = raw.strip()
        if not line:
            continue

        if line.startswith("#"):
            # comentarios
            if line.lower().startswith("# version"):
                version = line
                recognized += 1
            elif line.lower().startswith("# board"):
                board = line
                recognized += 1
            elif line.lower().startswith("# build"):
                build = line
                recognized += 1
            continue

        low = line.lower()

        if low.startswith("profile "):
            current_profile = line.split(" ", 1)[1].strip() or "0"
            current_rateprofile = None
            profile_settings.setdefault(current_profile, [])
            recognized += 1
            continue

        if low.startswith("rateprofile "):
            current_rateprofile = line.split(" ", 1)[1].strip() or "0"
            current_profile = None
            rateprofile_settings.setdefault(current_rateprofile, [])
            recognized += 1
            continue

        if low.startswith("resource ") or low.startswith("resource\t"):
            resource_lines.append(line)
            recognized += 1
            continue

        if low.startswith("aux ") or low.startswith("aux\t"):
            aux_lines.append(line)
            recognized += 1
            continue

        if low.startswith("set "):
            # settings global o por perfil
            if current_profile is not None:
                profile_settings.setdefault(current_profile, []).append(line)
            elif current_rateprofile is not None:
                rateprofile_settings.setdefault(current_rateprofile, []).append(line)
            else:
                global_settings.append(line)
            recognized += 1
            continue

        # Otros comandos típicos
        if any(low.startswith(p) for p in ("feature ", "map ", "serial ", "rate ", "rxrange ", "vtxtable ", "smix ", "mmix ")):
            other_cmds.append(line)
            recognized += 1
            continue

        unknown += 1
        if unknown <= 20:
            warnings.append(f"Unknown line: {line}")

    return {
        "meta": {
            "version": version,
            "board": board,
            "build": build,
        },
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

        # 1) borrar registros en BD (cascade debería borrar dumps)
        session.delete(d)
        session.commit()

    # 2) borrar ficheros en disco (best-effort)
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

        safe_original = _sanitize_filename(file.filename or "dump.txt")
        ext = Path(safe_original).suffix.lower()

        if ext not in ALLOWED_DUMP_EXTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension: {ext}",
            )

        # Directorio por dron
        drone_dir = DUMPS_DIR / f"drone_{drone_id}"
        drone_dir.mkdir(parents=True, exist_ok=True)

        # Nombre único
        stored_name = f"{uuid4().hex}_{safe_original}"
        dest_path = drone_dir / stored_name

        # Guardar a disco con límite (MAX_DUMP_UPLOAD_BYTES)
        size = 0
        try:
            with dest_path.open("wb") as out:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    size += len(chunk)
                    if size > MAX_DUMP_UPLOAD_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Dump upload too large",
                        )
                    out.write(chunk)
        except HTTPException:
            # si sobrepasó, intenta borrar lo escrito
            try:
                if dest_path.exists():
                    dest_path.unlink()
            except Exception:
                pass
            raise
        except Exception:
            try:
                if dest_path.exists():
                    dest_path.unlink()
            except Exception:
                pass
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Upload failed")
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
