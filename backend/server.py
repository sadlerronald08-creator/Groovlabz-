import os
import uuid
import logging
import secrets
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Annotated

import bcrypt
import httpx
import requests
from fastapi import FastAPI, APIRouter, HTTPException, Header, UploadFile, File, Form, Query
from fastapi.responses import Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, BeforeValidator, EmailStr

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET", "dev_secret")
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

# ---- Object storage ----
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "groove-sesh"
_storage_key: Optional[str] = None


def init_storage():
    global _storage_key
    if _storage_key:
        return _storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    global _storage_key
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 503:
        _storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    global _storage_key
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 503:
        _storage_key = None
        key = init_storage()
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---- Mongo helpers ----
def _oid_str(v: Any) -> str:
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_oid_str)]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# ---- Models ----
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str = "email"
    created_at: datetime = Field(default_factory=now_utc)


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class SessionExchange(BaseModel):
    session_id: str


class GrooveSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    bpm: int = 90
    count_in: bool = True
    metronome: bool = False
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)
    deleted_at: Optional[datetime] = None


class SessionCreate(BaseModel):
    title: str
    bpm: int = 90
    count_in: bool = True


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    bpm: Optional[int] = None
    count_in: Optional[bool] = None
    metronome: Optional[bool] = None


class Effects(BaseModel):
    eq: bool = False
    reverb: bool = False
    gain: float = 1.0
    trim_start: float = 0.0
    trim_end: float = 0.0


class Track(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    name: str
    storage_path: str
    order: int = 0
    volume: float = 1.0
    muted: bool = False
    solo: bool = False
    duration: float = 0.0
    source: str = "mic"
    color: int = 0
    effects: Effects = Field(default_factory=Effects)
    created_at: datetime = Field(default_factory=now_utc)
    deleted_at: Optional[datetime] = None


class TrackUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None
    volume: Optional[float] = None
    muted: Optional[bool] = None
    solo: Optional[bool] = None
    effects: Optional[Effects] = None


# ---- App ----
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---- Auth utils ----
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def create_session_token(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
    })
    return token


async def get_user_by_token(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        return None
    exp = sess.get("expires_at")
    if exp is not None:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now_utc():
            return None
    user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    return user


def token_from_header(authorization: Optional[str]) -> Optional[str]:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


async def require_user(authorization: Optional[str]) -> dict:
    user = await get_user_by_token(token_from_header(authorization))
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def user_public(u: dict) -> dict:
    return {"id": u["user_id"], "email": u["email"], "name": u["name"], "picture": u.get("picture")}


# ---- Auth routes ----
@api_router.post("/auth/register")
async def register(body: RegisterInput):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "picture": None,
        "auth_provider": "email",
        "password_hash": hash_password(body.password),
        "created_at": now_utc(),
    }
    await db.users.insert_one(doc)
    token = await create_session_token(user_id)
    return {"session_token": token, "user": user_public(doc)}


@api_router.post("/auth/login")
async def login(body: LoginInput):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = await create_session_token(user["user_id"])
    return {"session_token": token, "user": user_public(user)}


@api_router.post("/auth/session")
async def auth_session(body: SessionExchange):
    async with httpx.AsyncClient(timeout=30) as hc:
        r = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": body.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = (data.get("email") or "").lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name") or existing.get("name"),
            "picture": data.get("picture"),
        }})
        user = await db.users.find_one({"user_id": user_id})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name") or email.split("@")[0],
            "picture": data.get("picture"),
            "auth_provider": "google",
            "created_at": now_utc(),
        }
        await db.users.insert_one(user)
    token = await create_session_token(user_id)
    return {"session_token": token, "user": user_public(user)}


@api_router.get("/auth/me")
async def me(authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    return {"user": user_public(user)}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(default=None)):
    token = token_from_header(authorization)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


# ---- Session helpers ----
def session_public(s: dict, track_count: int = 0) -> dict:
    return {
        "id": s["id"],
        "title": s["title"],
        "bpm": s.get("bpm", 90),
        "count_in": s.get("count_in", True),
        "metronome": s.get("metronome", False),
        "created_at": s["created_at"].isoformat() if isinstance(s["created_at"], datetime) else s["created_at"],
        "updated_at": s["updated_at"].isoformat() if isinstance(s["updated_at"], datetime) else s["updated_at"],
        "track_count": track_count,
    }


def track_public(t: dict) -> dict:
    eff = t.get("effects") or {}
    return {
        "id": t["id"],
        "session_id": t["session_id"],
        "name": t["name"],
        "order": t.get("order", 0),
        "volume": t.get("volume", 1.0),
        "muted": t.get("muted", False),
        "solo": t.get("solo", False),
        "duration": t.get("duration", 0.0),
        "source": t.get("source", "mic"),
        "color": t.get("color", 0),
        "effects": {
            "eq": eff.get("eq", False),
            "reverb": eff.get("reverb", False),
            "gain": eff.get("gain", 1.0),
            "trim_start": eff.get("trim_start", 0.0),
            "trim_end": eff.get("trim_end", 0.0),
        },
        "audio_url": f"/api/audio/{t['id']}",
    }


# ---- Session routes ----
@api_router.get("/sessions")
async def list_sessions(authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    cursor = db.groove_sessions.find({"user_id": user["user_id"], "deleted_at": None}).sort("updated_at", -1)
    out = []
    async for s in cursor:
        count = await db.tracks.count_documents({"session_id": s["id"], "deleted_at": None})
        out.append(session_public(s, count))
    return out


@api_router.post("/sessions")
async def create_session(body: SessionCreate, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    s = GrooveSession(user_id=user["user_id"], title=body.title, bpm=body.bpm, count_in=body.count_in)
    await db.groove_sessions.insert_one(s.model_dump())
    return session_public(s.model_dump(), 0)


@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    s = await db.groove_sessions.find_one({"id": session_id, "user_id": user["user_id"], "deleted_at": None})
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    tracks = []
    async for t in db.tracks.find({"session_id": session_id, "deleted_at": None}).sort("order", 1):
        tracks.append(track_public(t))
    res = session_public(s, len(tracks))
    res["tracks"] = tracks
    return res


@api_router.patch("/sessions/{session_id}")
async def update_session(session_id: str, body: SessionUpdate, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_utc()
    r = await db.groove_sessions.update_one({"id": session_id, "user_id": user["user_id"]}, {"$set": updates})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    s = await db.groove_sessions.find_one({"id": session_id})
    count = await db.tracks.count_documents({"session_id": session_id, "deleted_at": None})
    return session_public(s, count)


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    await db.groove_sessions.update_one(
        {"id": session_id, "user_id": user["user_id"]}, {"$set": {"deleted_at": now_utc()}}
    )
    return {"ok": True}


# ---- Track routes ----
@api_router.post("/sessions/{session_id}/tracks")
async def add_track(
    session_id: str,
    name: str = Form(...),
    source: str = Form("mic"),
    duration: float = Form(0.0),
    color: int = Form(0),
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(default=None),
):
    user = await require_user(authorization)
    s = await db.groove_sessions.find_one({"id": session_id, "user_id": user["user_id"], "deleted_at": None})
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    data = await file.read()
    ext = "m4a"
    if file.filename and "." in file.filename:
        ext = file.filename.rsplit(".", 1)[-1].lower()
    track_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user['user_id']}/{track_id}.{ext}"
    ct = file.content_type or "audio/m4a"
    await run_in_threadpool(put_object, path, data, ct)

    order = await db.tracks.count_documents({"session_id": session_id, "deleted_at": None})
    track = Track(
        id=track_id, session_id=session_id, user_id=user["user_id"], name=name,
        storage_path=path, order=order, duration=duration, source=source, color=color,
    )
    doc = track.model_dump()
    doc["content_type"] = ct
    await db.tracks.insert_one(doc)
    await db.groove_sessions.update_one({"id": session_id}, {"$set": {"updated_at": now_utc()}})
    return track_public(doc)


@api_router.patch("/tracks/{track_id}")
async def update_track(track_id: str, body: TrackUpdate, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    updates = {}
    for k, v in body.model_dump().items():
        if v is not None:
            updates[k] = v
    r = await db.tracks.update_one({"id": track_id, "user_id": user["user_id"]}, {"$set": updates})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Track not found")
    t = await db.tracks.find_one({"id": track_id})
    return track_public(t)


@api_router.delete("/tracks/{track_id}")
async def delete_track(track_id: str, authorization: Optional[str] = Header(default=None)):
    user = await require_user(authorization)
    await db.tracks.update_one({"id": track_id, "user_id": user["user_id"]}, {"$set": {"deleted_at": now_utc()}})
    return {"ok": True}


@api_router.get("/audio/{track_id}")
async def get_audio(track_id: str, token: Optional[str] = Query(default=None), authorization: Optional[str] = Header(default=None)):
    auth_token = token_from_header(authorization) or token
    user = await get_user_by_token(auth_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    t = await db.tracks.find_one({"id": track_id})
    if not t or t.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=404, detail="Audio not found")
    content, ct = await run_in_threadpool(get_object, t["storage_path"])
    return Response(content=content, media_type=t.get("content_type", ct))


@api_router.get("/")
async def root():
    return {"message": "GroovSesh API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
        await db.groove_sessions.create_index("user_id")
        await db.tracks.create_index("session_id")
    except Exception as e:
        logger.warning(f"index setup: {e}")
    try:
        await run_in_threadpool(init_storage)
        logger.info("storage initialized")
    except Exception as e:
        logger.warning(f"storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
