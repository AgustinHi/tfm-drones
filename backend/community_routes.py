# backend/community_routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth_routes import get_current_user_email
from db import engine
from models import CommunityPost, Drone, DroneDump

router = APIRouter(prefix="/community", tags=["community"])


def _mask_email(email: str) -> str:
  """
  Devuelve un alias corto tipo: 'pu…' (sin dominio) para no exponer emails.
  """
  local = (email or "").split("@", 1)[0]
  if not local:
    return "pilot"
  if len(local) <= 2:
    return f"{local}…"
  return f"{local[:2]}…"


def _drone_to_public_dict(d: Drone) -> dict:
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


def _dump_to_public_dict(x: DroneDump) -> dict:
  return {
    "id": x.id,
    "drone_id": x.drone_id,
    "original_name": x.original_name,
    "bytes": x.bytes,
    "created_at": x.created_at.isoformat() if x.created_at else None,
  }


class PostUpsert(BaseModel):
  drone_id: int
  title: str | None = None
  public_note: str | None = None
  is_public: bool = True


class DumpVisibility(BaseModel):
  is_public: bool


@router.get("/feed")
def feed(q: str | None = None, limit: int = 24, offset: int = 0):
  """
  Feed público de comunidad.
  Devuelve publicaciones publicadas (community_posts.is_public=1) con:
  - drone (datos)
  - dumps públicos (máx 3) del dron
  """
  q_norm = (q or "").strip().lower()
  limit = max(1, min(int(limit), 50))
  offset = max(0, int(offset))

  with Session(engine) as session:
    stmt = (
      select(CommunityPost, Drone)
      .join(Drone, Drone.id == CommunityPost.drone_id)
      .where(CommunityPost.is_public == True)  # noqa: E712
      .order_by(CommunityPost.updated_at.desc(), CommunityPost.id.desc())
      .limit(limit)
      .offset(offset)
    )

    rows = session.execute(stmt).all()

    items: list[dict] = []
    for post, drone in rows:
      dumps = session.scalars(
        select(DroneDump)
        .where(DroneDump.drone_id == drone.id)
        .where(DroneDump.is_public == True)  # noqa: E712
        .order_by(DroneDump.created_at.desc(), DroneDump.id.desc())
        .limit(3)
      ).all()

      item = {
        "post": {
          "id": post.id,
          "title": post.title,
          "public_note": post.public_note,
          "is_public": bool(post.is_public),
          "created_at": post.created_at.isoformat() if post.created_at else None,
          "updated_at": post.updated_at.isoformat() if post.updated_at else None,
        },
        "owner": {"handle": _mask_email(post.owner_email)},
        "drone": _drone_to_public_dict(drone),
        "dumps": [_dump_to_public_dict(x) for x in dumps],
      }
      items.append(item)

    # filtro simple por texto (MVP)
    if q_norm:
      def _match(it: dict) -> bool:
        drone = it.get("drone") or {}
        post = it.get("post") or {}
        owner = it.get("owner") or {}
        hay = " ".join(
          [
            str(drone.get("id", "")),
            str(drone.get("name", "") or ""),
            str(drone.get("comment", "") or ""),
            str(post.get("title", "") or ""),
            str(post.get("public_note", "") or ""),
            str(owner.get("handle", "") or ""),
          ]
        ).lower()
        return q_norm in hay

      items = [it for it in items if _match(it)]

    return items


@router.get("/me")
def my_posts(user_email: str = Depends(get_current_user_email)):
  """
  Publicaciones del usuario autenticado (para gestionarlas desde Manage).
  """
  with Session(engine) as session:
    posts = session.scalars(
      select(CommunityPost)
      .where(CommunityPost.owner_email == user_email)
      .order_by(CommunityPost.updated_at.desc(), CommunityPost.id.desc())
    ).all()

    return [
      {
        "id": p.id,
        "drone_id": p.drone_id,
        "title": p.title,
        "public_note": p.public_note,
        "is_public": bool(p.is_public),
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
      }
      for p in posts
    ]


@router.post("/posts", status_code=status.HTTP_201_CREATED)
def upsert_post(payload: PostUpsert, user_email: str = Depends(get_current_user_email)):
  """
  Crea o actualiza la publicación (1 por dron+owner).
  """
  with Session(engine) as session:
    drone = session.get(Drone, payload.drone_id)
    if drone is None:
      raise HTTPException(status_code=404, detail="Drone not found")
    if drone.owner_email != user_email:
      raise HTTPException(status_code=403, detail="Not your drone")

    existing = session.scalar(
      select(CommunityPost).where(
        CommunityPost.drone_id == payload.drone_id,
        CommunityPost.owner_email == user_email,
      )
    )

    title = (payload.title or "").strip() or None
    note = (payload.public_note or "").strip() or None

    if existing is None:
      post = CommunityPost(
        drone_id=payload.drone_id,
        owner_email=user_email,
        title=title,
        public_note=note,
        is_public=bool(payload.is_public),
      )
      session.add(post)
      session.commit()
      session.refresh(post)
      return {"id": post.id}

    existing.title = title
    existing.public_note = note
    existing.is_public = bool(payload.is_public)
    session.commit()
    return {"id": existing.id}


@router.patch("/dumps/{dump_id}")
def set_dump_visibility(
  dump_id: int,
  payload: DumpVisibility,
  user_email: str = Depends(get_current_user_email),
):
  """
  Marca un dump como público/privado (solo dueño del dron).
  """
  with Session(engine) as session:
    dump = session.get(DroneDump, dump_id)
    if dump is None:
      raise HTTPException(status_code=404, detail="Dump not found")

    drone = session.get(Drone, dump.drone_id)
    if drone is None:
      raise HTTPException(status_code=404, detail="Drone not found")

    if drone.owner_email != user_email:
      raise HTTPException(status_code=403, detail="Not your dump")

    dump.is_public = bool(payload.is_public)
    session.commit()
    return {"id": dump.id, "is_public": bool(dump.is_public)}
