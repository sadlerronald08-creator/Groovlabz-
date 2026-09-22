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
import re
import ipaddress
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
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


class CheckoutRequest(BaseModel):
    items: List[CartItem]
    origin_url: str


class ActivityCreate(BaseModel):
    app_id: str
    action: str
    details: Optional[str] = None


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


@api_router.post("/auth/login")
async def login(payload: UserLogin, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
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

    origin = req.origin_url.rstrip("/")
    session = stripe.checkout.Session.create(
        line_items=line_items,
        mode="payment",
        success_url=f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{origin}/payment/cancel",
        metadata={"user_id": user_id or "guest", "items": ",".join(lookup_summary)[:400]},
    )

    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user_id,
        "items": [it.model_dump() for it in req.items],
        "amount": total,
        "currency": "usd",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


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
    except Exception as e:
        logger.warning(f"Index setup: {e}")

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
