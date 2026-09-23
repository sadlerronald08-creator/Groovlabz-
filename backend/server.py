"""GroovLabz backend server: auth, shop, cart, orders (Stripe), contact, account activity."""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt as pyjwt
import stripe
import httpx
import requests
import re
import ipaddress
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# ---- Setup ----------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("groovlabz")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "GroovLabz")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "delivered@resend.dev")

app = FastAPI(title="GroovLabz API")
api_router = APIRouter(prefix="/api")

# ---- Product catalog (server-side source of truth) --------
SHOP_PRODUCTS = [
    {
        "id": "lightning-v",
        "name": "GroovLabz Lightning V",
        "price": 399.00,
        "tag": "Bluetooth Built‑In",
        "image": "/shop/lightning-v.jpg",
        "gallery": [
            {"src": "/shop/lightning-v.jpg", "label": "Full view"},
            {"src": "/shop/lightning-v-headstock.jpg", "label": "Headstock"},
            {"src": "/shop/lightning-v-pickups.jpg", "label": "Pickups & bridge"},
            {"src": "/shop/lightning-v-finish.jpg", "label": "Lightning finish"},
        ],
        "description": "The GroovSesh Flying‑V, for real — with GroovPuck Bluetooth built into the body. Pearl‑white finish struck with electric‑blue lightning, blue binding, chrome hardware and the GROOVLABZ headstock. Plays wirelessly into GroovBox, GroovSesh and any GroovLabz amp.",
        "specs": ["Built‑in Bluetooth 5.3 transmitter, <4ms latency", "Flying‑V body, pearl white with blue lightning finish", "Dual chrome humbuckers, 3‑way selector", "Block‑inlay rosewood neck, 22 frets", "12‑hour battery, USB‑C charging", "Ships set up & ready to play"],
        "sheet": {"Body": "Mahogany Flying‑V", "Neck": "Set mahogany, rosewood board", "Scale": "24.75\"", "Pickups": "2× GroovLabz Alnico humbuckers", "Wireless": "Bluetooth 5.3 · 12 h battery", "Hardware": "Chrome tune‑o‑matic, locking tuners", "Weight": "3.2 kg", "Includes": "Gig bag, USB‑C cable, strap"},
        "category": "Signature Guitars",
    },
    {
        "id": "galaxy-v",
        "name": "GroovLabz Galaxy V",
        "price": 299.00,
        "tag": "Signature",
        "image": "/shop/galaxy-v.jpg",
        "gallery": [
            {"src": "/shop/galaxy-v.jpg", "label": "Full view"},
            {"src": "/shop/galaxy-v-headstock.jpg", "label": "Headstock"},
            {"src": "/shop/galaxy-v-pickups.jpg", "label": "Pickups & knobs"},
            {"src": "/shop/galaxy-v-finish.jpg", "label": "Nebula finish"},
        ],
        "description": "Playable Flying‑V electric guitar in a hand‑finished nebula galaxy wrap with neon‑green pickup rings, knobs and jack ring. GROOVLABZ headstock, ∞ inlay at the 12th fret.",
        "specs": ["Flying‑V body, galaxy nebula finish", "Dual humbuckers, glow‑green rings", "Rosewood neck, ∞ inlay", "Ships set up & ready to play"],
        "sheet": {"Body": "Basswood Flying‑V", "Neck": "Bolt‑on maple, rosewood board", "Scale": "25.5\"", "Pickups": "2× GroovLabz ceramic humbuckers", "Hardware": "Black tune‑o‑matic, neon‑green rings", "Weight": "3.1 kg", "Includes": "Gig bag, strap"},
        "category": "Signature Guitars",
    },
    {
        "id": "storm-v",
        "name": "GroovLabz Storm V",
        "price": 299.00,
        "tag": "Signature",
        "image": "/shop/storm-v.jpg",
        "gallery": [
            {"src": "/shop/storm-v.jpg", "label": "Full view"},
            {"src": "/shop/storm-v-headstock.jpg", "label": "Headstock"},
            {"src": "/shop/storm-v-pickups.jpg", "label": "Pickups & bridge"},
            {"src": "/shop/storm-v-finish.jpg", "label": "Storm finish"},
        ],
        "description": "The black one. Gloss‑black Flying‑V struck with blue‑violet lightning, electric‑blue binding and the ∞ inlay — the guitar you see on the GroovSesh home screen.",
        "specs": ["Flying‑V body, gloss black with blue‑violet lightning", "Dual chrome humbuckers", "Rosewood neck, ∞ inlay at the 12th fret", "Blue binding & GROOVLABZ headstock"],
        "sheet": {"Body": "Mahogany Flying‑V", "Neck": "Set mahogany, rosewood board", "Scale": "24.75\"", "Pickups": "2× GroovLabz Alnico humbuckers", "Hardware": "Chrome tune‑o‑matic, blue binding", "Weight": "3.2 kg", "Includes": "Gig bag, strap"},
        "category": "Signature Guitars",
    },
    {
        "id": "groovmic-bt",
        "name": "GroovMic Bluetooth Vocal Microphone",
        "price": 129.00,
        "tag": "New",
        "image": "/shop/groovmic-bt.jpg",
        "description": "Handheld wireless vocal mic that pairs straight into GroovBox, GroovSesh and GroovLabz amps. Cardioid capsule, LED status ring and a charging dock.",
        "specs": ["Bluetooth 5.3, <4ms latency to GroovBox", "Cardioid dynamic capsule", "10‑hour battery + charging dock", "Pairs with any GroovLabz amp"],
        "category": "Bluetooth Hardware",
    },
    {
        "id": "groovwah",
        "name": "GroovWah Expression Pedal",
        "price": 89.00,
        "tag": "New",
        "image": "/shop/groovwah.jpg",
        "description": "Rugged wah pedal with a true‑bypass sweep and Bluetooth expression control for GroovBox effects.",
        "specs": ["Classic vocal wah sweep", "Bluetooth expression → GroovBox", "True bypass, blue LED", "Steel chassis, rubber treadle grip"],
        "category": "Pedals",
    },
    {
        "id": "groovamp-12",
        "name": "GroovAmp 12 Combo (12 W)",
        "price": 219.00,
        "tag": "Amps",
        "image": "/shop/groovamp-12.jpg",
        "description": "12‑watt combo with Bluetooth input for GroovBox tones, 8\" speaker and a brushed‑steel panel. Loud enough for the rehearsal room.",
        "specs": ["12 W, 8\" GroovLabz speaker", "Bluetooth audio in from GroovBox & GroovMic", "Gain / Bass / Mid / Treble / Volume", "Headphone out, aux in"],
        "category": "Amps",
    },
    {
        "id": "groovamp-10",
        "name": "GroovAmp 10 Practice Amp (10 W)",
        "price": 149.00,
        "tag": "Amps",
        "image": "/shop/groovamp-10.jpg",
        "description": "Compact 10‑watt practice amp with Bluetooth, built‑in tuner and a bedroom‑friendly power scaling switch.",
        "specs": ["10 W, 6.5\" speaker", "Bluetooth in, power scaling 10 / 1 W", "Built‑in tuner", "Headphone out"],
        "category": "Amps",
    },
    {
        "id": "groovamp-7",
        "name": "GroovAmp Go Portable (7 W)",
        "price": 99.00,
        "tag": "Portable",
        "image": "/shop/groovamp-7.jpg",
        "description": "Battery‑powered 7‑watt amp with a leather strap handle. Busk, jam in the park, or record straight into GroovSesh over Bluetooth.",
        "specs": ["7 W, 12‑hour rechargeable battery", "Bluetooth in / out", "Leather strap handle", "USB‑C charging"],
        "category": "Amps",
    },
    {
        "id": "strings-green",
        "name": "GroovLabz Neon Strings — Green (.010–.046)",
        "price": 14.99,
        "tag": "Strings",
        "image": "/shop/strings-green.jpg",
        "description": "Coated nickel electric strings in vivid neon green. Glow under stage UV, resist corrosion, feel slick.",
        "specs": ["6‑string set .010–.046", "Neon green polymer coating", "UV‑reactive", "Made in USA"],
        "category": "Strings",
    },
    {
        "id": "strings-purple",
        "name": "GroovLabz Neon Strings — Purple (.010–.046)",
        "price": 14.99,
        "tag": "Strings",
        "image": "/shop/strings-purple.jpg",
        "description": "Coated nickel electric strings in vivid neon purple. Glow under stage UV, resist corrosion, feel slick.",
        "specs": ["6‑string set .010–.046", "Neon purple polymer coating", "UV‑reactive", "Made in USA"],
        "category": "Strings",
    },
    {
        "id": "strings-blue",
        "name": "GroovLabz Neon Strings — Blue (.010–.046)",
        "price": 14.99,
        "tag": "Strings",
        "image": "/shop/strings-blue.jpg",
        "description": "Coated nickel electric strings in electric neon blue. Glow under stage UV, resist corrosion, feel slick.",
        "specs": ["6‑string set .010–.046", "Neon blue polymer coating", "UV‑reactive", "Made in USA"],
        "category": "Strings",
    },
    {
        "id": "groovpuck-bt",
        "name": "GroovPuck Bluetooth Guitar Adapter",
        "price": 149.99,
        "tag": "Best Seller",
        "image": "https://images.pexels.com/photos/29205062/pexels-photo-29205062.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "description": "Low-latency Bluetooth 5.3 transmitter attaching to any standard guitar jack. Wirelessly sends audio signal directly to GroovGuitar & GroovSesh apps with under 4ms delay.",
        "specs": ["Ultra-low <4ms latency", "12-hour rechargeable battery", "USB-C fast charging", "Anodized aluminum alloy body"],
        "category": "Bluetooth Hardware",
    },
    {
        "id": "groovlink-pedal",
        "name": "GroovLink Smart Wireless Foot Controller",
        "price": 199.99,
        "tag": "New Hardware",
        "image": "https://images.pexels.com/photos/13981274/pexels-photo-13981274.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "description": "Programmable 4-footswitch MIDI controller for hands-free app control, page turning on GroovChords, and patch switching.",
        "specs": ["4 silent tactile switches", "OLED patch display", "Bluetooth & USB MIDI", "Heavy-duty steel chassis"],
        "category": "MIDI Controller",
    },
    {
        "id": "groovphones-pro",
        "name": "GroovPhones Reference Studio Headphones",
        "price": 179.99,
        "tag": "Studio Edition",
        "image": "https://images.unsplash.com/photo-1559327875-12005444b626?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHw0fHxyZWNvcmRpbmclMjBzdHVkaW8lMjBzb3VuZGJvYXJkJTIwc3ludGhlc2l6ZXIlMjBuZW9uJTIwY3lhbiUyMGxpZ2h0fGVufDB8fHx8MTc5MDExMDkzNnww&ixlib=rb-4.1.0&q=85",
        "description": "Flat frequency response closed-back monitoring headphones tuned specifically for mixing with GroovSesh and GroovMash.",
        "specs": ["50mm neodymium drivers", "15Hz - 28kHz frequency response", "Detachable coiled cable", "Memory foam ear cushions"],
        "category": "Studio Monitoring",
    },
    {
        "id": "gigbag",
        "name": "GroovLabz Padded Gig Bag",
        "price": 49.00,
        "tag": "Gift Wrap",
        "image": "/shop/gigbag.jpg",
        "description": "Padded Flying‑V gig bag with GROOVLABZ ∞ embroidery, backpack straps and a strings/cable pocket. Add it to any Stage Kit as gift wrap — we pack the kit inside and tuck in your note.",
        "specs": ["Fits all GroovLabz Flying‑Vs", "20 mm padding, backpack straps", "Accessory pocket for strings & cables", "Neon‑blue ∞ embroidery"],
        "category": "Cables & Accessories",
    },
    {
        "id": "groovcable-trs",
        "name": "GroovCable Braided TRS Instrument Cable (3m)",
        "price": 29.99,
        "tag": "Studio Essential",
        "image": "https://images.pexels.com/photos/8197260/pexels-photo-8197260.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "description": "Braided oxygen-free copper instrument cable with gold-plated 6.35mm jacks. Zero interference and studio-grade signal integrity.",
        "specs": ["Oxygen-free copper", "Gold-plated jacks", "3m nylon-braided sheath", "Lifetime warranty"],
        "category": "Cables & Accessories",
    },
]

KIT_DISCOUNT = 0.15
KIT_AMP_ID = "groovamp-12"


def _product(pid):
    return next((p for p in SHOP_PRODUCTS if p["id"] == pid), None)


def _build_kits():
    kits = []
    amp = _product(KIT_AMP_ID)
    for g in [p for p in SHOP_PRODUCTS if p["category"] == "Signature Guitars"]:
        for s in [p for p in SHOP_PRODUCTS if p["category"] == "Strings"]:
            full = g["price"] + amp["price"] + s["price"]
            color = s["name"].split("—")[1].split("(")[0].strip()
            kits.append({
                "id": f"kit-{g['id']}-{s['id']}",
                "name": f"Stage Kit — {g['name'].replace('GroovLabz ', '')} + GroovAmp 12 + {color} Strings",
                "price": round(full * (1 - KIT_DISCOUNT), 2),
                "full_price": round(full, 2),
                "tag": "Stage Kit · 15% off",
                "image": g["image"],
                "kind": "bundle",
                "includes": [g["id"], amp["id"], s["id"]],
                "description": f"Everything for the stage in one tap: the {g['name']}, the 12‑watt GroovAmp 12 combo and a set of {color.lower()} neon strings — 15% off buying them separately.",
                "specs": [g["name"], amp["name"], s["name"], "Saves 15% vs. separate purchase"],
                "category": "Stage Kits",
            })
    return kits


SHOP_PRODUCTS += _build_kits()


# ---- Models ---------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class CartItem(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)
    gift_note: Optional[str] = Field(default=None, max_length=300)


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    origin_url: str


class StoreLinks(BaseModel):
    ios: str = Field(default="", max_length=500)
    android: str = Field(default="", max_length=500)


APP_IDS = {"groovsesh", "groovbox", "groovmash", "groovtrackz", "groovcharts"}
_STORE_HOSTS = ("apps.apple.com", "play.google.com", "www.apple.com")


class ActivityCreate(BaseModel):
    app_id: str
    action: str
    details: Optional[str] = None


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=2000)
    photo_id: Optional[str] = None


# ---- Object storage (Emergent) ---------------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
STORAGE_APP = "groovlabz"
storage_key: Optional[str] = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(), "Content-Type": content_type}, data=data, timeout=120)
    if resp.status_code == 404:
        resp = requests.put(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=True), "Content-Type": content_type}, data=data, timeout=120)
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage()}, timeout=60)
    if resp.status_code == 404:
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": init_storage(force=True)}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ---- Auth helpers ---------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(uid: str, email: str) -> str:
    payload = {"sub": uid, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=60 * 60 * 24 * 7, path="/"
    )


# ---- Email guardrail gate (from playbook) ---------------------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    if not EMAIL_KEY:
        logger.info("Email skipped (no EMERGENT_EMAIL_KEY)")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return None


# ---- AUTH endpoints ------------------------------------------
@api_router.post("/auth/register")
async def register(payload: UserRegister, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": email,
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(uid, email)
    set_auth_cookie(response, token)
    return {"id": uid, "email": email, "name": payload.name, "role": "user", "token": token}


LOCKOUT_MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


@api_router.post("/auth/login")
async def login(payload: UserLogin, request: Request, response: Response):
    email = payload.email.lower()
    identifier = f"{_client_ip(request)}:{email}"
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    locked_until = attempt.get("locked_until") if attempt else None
    if locked_until and locked_until.replace(tzinfo=timezone.utc) > now:
        retry = int((locked_until.replace(tzinfo=timezone.utc) - now).total_seconds() // 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Too many failed attempts. Try again in {retry} minute{'s' if retry != 1 else ''}.",
            headers={"Retry-After": str(retry * 60)},
        )
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        count = (attempt.get("count", 0) if attempt and not attempt.get("locked_until") else 0) + 1
        update = {"$set": {"count": count, "updated_at": now}}
        if count >= LOCKOUT_MAX_ATTEMPTS:
            update["$set"]["locked_until"] = now + timedelta(minutes=LOCKOUT_MINUTES)
        else:
            update["$unset"] = {"locked_until": ""}
        await db.login_attempts.update_one({"identifier": identifier}, update, upsert=True)
        if count >= LOCKOUT_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed attempts. Account locked for {LOCKOUT_MINUTES} minutes.",
                headers={"Retry-After": str(LOCKOUT_MINUTES * 60)},
            )
        remaining = LOCKOUT_MAX_ATTEMPTS - count
        raise HTTPException(status_code=401, detail=f"Invalid email or password. {remaining} attempt{'s' if remaining != 1 else ''} left before lockout.")
    await db.login_attempts.delete_one({"identifier": identifier})
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"id": user["id"], "email": email, "name": user["name"], "role": user.get("role", "user"), "token": token}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"status": "logged out"}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---- Shop ----------------------------------------------------
@api_router.get("/shop/products")
async def get_products():
    return SHOP_PRODUCTS


@api_router.get("/shop/products/{pid}")
async def get_product(pid: str):
    p = next((x for x in SHOP_PRODUCTS if x["id"] == pid), None)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


# ---- Reviews (verified buyers) --------------------------------
async def _has_purchased(user_id: str, pid: str) -> bool:
    orders = await db.payment_transactions.find({"user_id": user_id, "payment_status": "paid"}, {"items": 1}).to_list(500)
    for o in orders:
        for it in o.get("items", []):
            if it.get("product_id") == pid:
                return True
            kit = _product(it.get("product_id"))
            if kit and pid in kit.get("includes", []):
                return True
    return False


@api_router.get("/shop/products/{pid}/reviews")
async def list_reviews(pid: str):
    if not _product(pid):
        raise HTTPException(status_code=404, detail="Product not found")
    reviews = await db.reviews.find({"product_id": pid}, {"_id": 0, "user_id": 0}).sort("created_at", -1).to_list(200)
    avg = round(sum(r["rating"] for r in reviews) / len(reviews), 1) if reviews else None
    return {"reviews": reviews, "count": len(reviews), "average": avg}


@api_router.get("/shop/products/{pid}/can-review")
async def can_review(pid: str, user=Depends(get_current_user)):
    purchased = await _has_purchased(user["id"], pid)
    existing = await db.reviews.find_one({"product_id": pid, "user_id": user["id"]})
    return {"can_review": purchased and not existing, "purchased": purchased, "already_reviewed": bool(existing)}


@api_router.post("/shop/products/{pid}/reviews")
async def create_review(pid: str, payload: ReviewCreate, user=Depends(get_current_user)):
    if not _product(pid):
        raise HTTPException(status_code=404, detail="Product not found")
    if not await _has_purchased(user["id"], pid):
        raise HTTPException(status_code=403, detail="Only verified buyers can review this product")
    if await db.reviews.find_one({"product_id": pid, "user_id": user["id"]}):
        raise HTTPException(status_code=409, detail="You already reviewed this product")
    photo_url = None
    if payload.photo_id:
        f = await db.files.find_one({"id": payload.photo_id, "user_id": user["id"], "is_deleted": False})
        if not f:
            raise HTTPException(status_code=400, detail="Photo not found")
        photo_url = f"/api/files/{f['id']}"
    doc = {
        "id": str(uuid.uuid4()),
        "product_id": pid,
        "user_id": user["id"],
        "author": user["name"],
        "rating": payload.rating,
        "title": payload.title.strip(),
        "body": payload.body.strip(),
        "photo_url": photo_url,
        "verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("user_id", None)
    return doc


ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@api_router.post("/uploads/review-photo")
async def upload_review_photo(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = ALLOWED_IMAGE_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Only JPG, PNG or WEBP images are allowed")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be under 5 MB")
    fid = str(uuid.uuid4())
    path = f"{STORAGE_APP}/reviews/{user['id']}/{fid}.{ext}"
    try:
        result = put_object(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Photo upload failed, please try again")
    await db.files.insert_one({
        "id": fid, "user_id": user["id"], "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result.get("size", len(data)), "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"id": fid, "url": f"/api/files/{fid}"}


@api_router.get("/files/{fid}")
async def serve_file(fid: str):
    record = await db.files.find_one({"id": fid, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, ctype = get_object(record["storage_path"])
    except Exception as e:
        logger.error(f"Storage read failed: {e}")
        raise HTTPException(status_code=502, detail="File unavailable")
    return Response(content=data, media_type=record.get("content_type", ctype), headers={"Cache-Control": "public, max-age=86400"})


# ---- Store links (admin editable) ----------------------------
@api_router.get("/store-links")
async def get_store_links():
    docs = await db.store_links.find({}, {"_id": 0}).to_list(20)
    return {d["app_id"]: {"ios": d.get("ios", ""), "android": d.get("android", "")} for d in docs}


@api_router.put("/admin/store-links/{app_id}")
async def set_store_links(app_id: str, payload: StoreLinks, user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    if app_id not in APP_IDS:
        raise HTTPException(status_code=404, detail="Unknown app")
    for url in (payload.ios, payload.android):
        if url:
            host = urlparse(url).hostname or ""
            if not url.startswith("https://") or not any(host == h or host.endswith("." + h) for h in _STORE_HOSTS):
                raise HTTPException(status_code=400, detail=f"Not a valid App Store / Google Play link: {url}")
    await db.store_links.update_one(
        {"app_id": app_id},
        {"$set": {"app_id": app_id, "ios": payload.ios.strip(), "android": payload.android.strip(),
                  "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"app_id": app_id, "ios": payload.ios.strip(), "android": payload.android.strip()}


# ---- Checkout (Stripe) --------------------------------------
@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    line_items = []
    total = 0.0
    lookup_summary = []
    for it in req.items:
        product = next((p for p in SHOP_PRODUCTS if p["id"] == it.product_id), None)
        if not product:
            raise HTTPException(status_code=400, detail=f"Unknown product: {it.product_id}")
        line_items.append({
            "price_data": {
                "currency": "usd",
                "unit_amount": int(round(product["price"] * 100)),
                "product_data": {"name": product["name"], "images": [product["image"]]},
            },
            "quantity": it.quantity,
        })
        total += float(product["price"]) * it.quantity
        lookup_summary.append(f"{product['id']} x{it.quantity}")

    user_id = None
    try:
        user = await get_current_user(request)
        user_id = user.get("id")
    except HTTPException:
        pass

    gift_notes = {it.product_id: it.gift_note.strip() for it in req.items if it.gift_note and it.gift_note.strip()}
    origin = req.origin_url.rstrip("/")
    for li in line_items:
        img = li["price_data"]["product_data"]["images"][0]
        if img.startswith("/"):
            li["price_data"]["product_data"]["images"] = [f"{origin}{img}"]
    session = stripe.checkout.Session.create(
        line_items=line_items,
        mode="payment",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/payment/cancel",
        metadata={"user_id": user_id or "guest", "items": ",".join(lookup_summary)[:400],
                  "gift_note": " | ".join(gift_notes.values())[:480]},
    )

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user_id,
        "origin": origin,
        "gift_notes": gift_notes,
        "items": [it.model_dump() for it in req.items],
        "amount": total,
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


async def send_receipt(session_id: str, buyer_email: Optional[str]):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record or record.get("receipt_sent"):
        return
    to = buyer_email
    if not to and record.get("user_id"):
        u = await db.users.find_one({"id": record["user_id"]})
        to = u["email"] if u else None
    if not to:
        return
    origin = record.get("origin") or ""
    rows = ""
    for it in record.get("items", []):
        p = next((x for x in SHOP_PRODUCTS if x["id"] == it["product_id"]), None)
        if not p:
            continue
        rows += (f'<tr><td style="padding:8px 0;border-bottom:1px solid #23283B">{escape(p["name"])} × {it["quantity"]}</td>'
                 f'<td style="padding:8px 0;border-bottom:1px solid #23283B;text-align:right">${p["price"] * it["quantity"]:.2f}</td></tr>')
        note = (record.get("gift_notes") or {}).get(it["product_id"])
        if note:
            rows += f'<tr><td colspan="2" style="padding:0 0 8px 0;color:#94A3B8;font-style:italic">Gift note: “{escape(note)}”</td></tr>'
    account_link = (f'<p style="margin:20px 0"><a href="{origin}/account" style="background:#00F0FF;color:#0B0C10;padding:12px 20px;'
                    f'border-radius:999px;text-decoration:none;font-weight:bold">View your orders</a></p>') if origin.startswith("https://") else ""
    html = (
        '<table role="presentation" width="100%" style="font-family:Arial,sans-serif;background:#0B0C10;color:#F1F5F9">'
        '<tr><td style="padding:28px">'
        '<p style="color:#00F0FF;letter-spacing:3px;font-size:11px;margin:0 0 6px 0">GROOVLABZ</p>'
        '<h2 style="margin:0 0 16px 0">Thanks for your order!</h2>'
        f'<p style="color:#94A3B8">Order reference: {escape(session_id[-12:])}</p>'
        f'<table width="100%" style="border-collapse:collapse;margin:16px 0">{rows}'
        f'<tr><td style="padding:12px 0;font-weight:bold">Total</td><td style="padding:12px 0;text-align:right;font-weight:bold;color:#00F0FF">${record.get("amount", 0):.2f}</td></tr></table>'
        f'{account_link}'
        '<p style="font-size:12px;color:#94A3B8">We will email tracking once your gear ships. We never ask for passwords or card details by email.</p>'
        '</td></tr></table>'
    )
    subject = "Your GroovLabz order receipt"
    await send_email(to=to, subject=subject, html=html)
    await send_email(to=OWNER_EMAIL, subject=f"[GroovLabz Sale] {to} — ${record.get('amount', 0):.2f}", html=html)
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"receipt_sent": True, "buyer_email": to}})


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed", "payment_status": "paid",
                        "stripe_payment_intent_id": s.payment_intent,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
                cd = getattr(s, "customer_details", None)
                await send_receipt(session_id, getattr(cd, "email", None) if cd else None)
        except Exception as e:
            logger.warning(f"Stripe status lookup failed: {e}")
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "amount": record.get("amount"),
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed",
                      "payment_status": obj.get("payment_status", "paid"),
                      "stripe_payment_intent_id": obj.get("payment_intent"),
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        await send_receipt(obj["id"], (obj.get("customer_details") or {}).get("email"))
    return {"status": "ok"}


@api_router.get("/orders/mine")
async def my_orders(user=Depends(get_current_user)):
    orders = await db.payment_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return orders


# ---- Contact form -------------------------------------------
@api_router.post("/contact")
async def contact(payload: ContactMessage):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": payload.email,
        "subject": payload.subject,
        "message": payload.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contact_messages.insert_one(doc)

    subject = f"[GroovLabz Contact] {payload.subject}"
    html = (
        '<table role="presentation" width="100%" style="font-family:Arial,sans-serif">'
        '<tr><td style="padding:24px;background:#0B0C10;color:#F1F5F9">'
        f'<h2 style="color:#00F0FF;margin:0 0 12px 0">New Message from GroovLabz Contact Form</h2>'
        f'<p><strong>From:</strong> {escape(payload.name)} &lt;{escape(payload.email)}&gt;</p>'
        f'<p><strong>Subject:</strong> {escape(payload.subject)}</p>'
        f'<p style="white-space:pre-wrap;background:#141722;padding:16px;border-left:3px solid #00F0FF">{escape(payload.message)}</p>'
        f'<p style="font-size:12px;color:#94A3B8">Sent via {escape(EMAIL_FROM_NAME)} website. We never ask for passwords or card details by email.</p>'
        '</td></tr></table>'
    )
    await send_email(to=OWNER_EMAIL, subject=subject, html=html)
    return {"id": doc["id"], "status": "received"}


# ---- User activity ------------------------------------------
@api_router.post("/activity")
async def log_activity(payload: ActivityCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "app_id": payload.app_id,
        "action": payload.action,
        "details": payload.details,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.activity.insert_one(doc)
    return {"id": doc["id"], "status": "logged"}


@api_router.get("/activity/mine")
async def my_activity(user=Depends(get_current_user)):
    items = await db.activity.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api_router.get("/account/dashboard")
async def account_dashboard(user=Depends(get_current_user)):
    orders = await db.payment_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    activity = await db.activity.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    connected_apps = list({a.get("app_id") for a in activity})
    total_spent = sum(o.get("amount", 0) for o in orders if o.get("payment_status") == "paid")
    return {
        "user": user,
        "orders": orders,
        "activity": activity,
        "connected_apps": connected_apps,
        "stats": {
            "orders_count": len(orders),
            "total_spent": round(total_spent, 2),
            "apps_connected": len(connected_apps),
        },
    }


@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "groovlabz"}


# ---- Startup: seed admin, indexes ---------------------------
@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.payment_transactions.create_index("session_id", unique=True)
        await db.login_attempts.create_index("identifier", unique=True)
        await db.login_attempts.create_index("updated_at", expireAfterSeconds=LOCKOUT_MINUTES * 60)
        await db.reviews.create_index([("product_id", 1), ("user_id", 1)], unique=True)
        await db.files.create_index("id", unique=True)
    except Exception as e:
        logger.warning(f"Index setup: {e}")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@groovlabz.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "GroovLabz Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password re-synced from env")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
