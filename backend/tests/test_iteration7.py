"""Iteration 7: Kit gift wrap + Admin store links tests."""
import os
import pytest
import requests
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"
ADMIN_EMAIL = "admin@groovlabz.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def non_admin_session():
    s = requests.Session()
    email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "testpass123", "name": "Test User"})
    assert r.status_code in (200, 201), r.text
    return s


# --- Gigbag product ---
def test_gigbag_product():
    r = requests.get(f"{API}/shop/products/gigbag")
    assert r.status_code == 200
    data = r.json()
    assert data["price"] == 49.0


# --- Store links: public GET ---
def test_get_store_links_public():
    r = requests.get(f"{API}/store-links")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)


# --- PUT store links auth checks ---
def test_put_store_links_unauth():
    r = requests.put(f"{API}/admin/store-links/groovbox", json={"ios": "", "android": ""})
    assert r.status_code == 401


def test_put_store_links_non_admin_forbidden(non_admin_session):
    r = non_admin_session.put(f"{API}/admin/store-links/groovbox", json={"ios": "", "android": ""})
    assert r.status_code == 403


def test_put_store_links_invalid_url(admin_session):
    r = admin_session.put(f"{API}/admin/store-links/groovbox", json={"ios": "https://evil.com/x", "android": ""})
    assert r.status_code == 400


def test_put_store_links_unknown_app(admin_session):
    r = admin_session.put(f"{API}/admin/store-links/unknownapp",
                          json={"ios": "https://apps.apple.com/us/app/x/id1", "android": ""})
    assert r.status_code == 404


def test_put_store_links_success_and_get(admin_session):
    ios = "https://apps.apple.com/us/app/groovbox/id123456789"
    android = "https://play.google.com/store/apps/details?id=com.groovlabz.groovbox"
    r = admin_session.put(f"{API}/admin/store-links/groovbox", json={"ios": ios, "android": android})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["ios"] == ios and data["android"] == android

    r2 = requests.get(f"{API}/store-links")
    assert r2.status_code == 200
    all_links = r2.json()
    assert "groovbox" in all_links
    assert all_links["groovbox"]["ios"] == ios
    assert all_links["groovbox"]["android"] == android


def test_zzz_cleanup_store_links(admin_session):
    """Cleanup: revert groovbox to empty."""
    r = admin_session.put(f"{API}/admin/store-links/groovbox", json={"ios": "", "android": ""})
    assert r.status_code == 200


# --- Checkout with gift notes ---
def test_checkout_with_kit_and_gift_note(admin_session):
    payload = {
        "items": [
            {"product_id": "kit-galaxy-v-strings-green", "quantity": 1, "gift_note": "Happy birthday Ron!"},
            {"product_id": "gigbag", "quantity": 1},
        ],
        "origin_url": BASE,
    }
    r = requests.post(f"{API}/payments/checkout", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "checkout_url" in data and "checkout.stripe.com" in data["checkout_url"]
    session_id = data["session_id"]

    # verify Mongo doc
    async def _check():
        mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        db_name = os.environ.get("DB_NAME", "test_database")
        client = AsyncIOMotorClient(mongo_url)
        doc = await client[db_name].payment_transactions.find_one({"session_id": session_id})
        client.close()
        return doc

    # Backend runs in same env so use local Mongo
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "test_database")
    doc = asyncio.get_event_loop().run_until_complete(_check())
    assert doc is not None
    assert doc.get("gift_notes", {}).get("kit-galaxy-v-strings-green") == "Happy birthday Ron!"
    assert doc["items"][0].get("gift_note") == "Happy birthday Ron!"

    # amount: kit price + 49
    kit_price = requests.get(f"{API}/shop/products/kit-galaxy-v-strings-green").json()["price"]
    assert abs(doc["amount"] - (kit_price + 49.0)) < 0.01


def test_checkout_gift_note_too_long():
    payload = {
        "items": [
            {"product_id": "kit-galaxy-v-strings-green", "quantity": 1, "gift_note": "x" * 301},
        ],
        "origin_url": BASE,
    }
    r = requests.post(f"{API}/payments/checkout", json=payload)
    assert r.status_code == 422
