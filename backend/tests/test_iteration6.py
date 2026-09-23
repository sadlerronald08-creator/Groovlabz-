"""Iteration 6: Stage kits, reviews, uploads/files."""
import os
import io
import struct
import zlib
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://groov-nexus.preview.emergentagent.com").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = "admin@groovlabz.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json().get("access_token") or r.json().get("token")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module", autouse=True)
def cleanup_storm_v_reviews():
    yield
    # Delete any storm-v reviews created by tests so frontend can post via UI
    cli = MongoClient(MONGO_URL)
    cli[DB_NAME].reviews.delete_many({"product_id": "storm-v"})
    cli.close()


# ---------- Products / bundles ----------

def test_products_list_24_with_9_bundles(s):
    r = s.get(f"{BASE_URL}/api/shop/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) == 24, f"got {len(products)}"
    bundles = [p for p in products if p.get("kind") == "bundle"]
    assert len(bundles) == 9, f"expected 9 bundles, got {len(bundles)}"


def test_kit_lightning_v_strings_green_pricing(s):
    r = s.get(f"{BASE_URL}/api/shop/products/kit-lightning-v-strings-green")
    assert r.status_code == 200
    p = r.json()
    assert p["kind"] == "bundle"
    assert set(p["includes"]) == {"lightning-v", "groovamp-12", "strings-green"}
    assert p["full_price"] == 632.99
    assert p["price"] == 538.04


def test_kit_galaxy_v_strings_purple_200(s):
    r = s.get(f"{BASE_URL}/api/shop/products/kit-galaxy-v-strings-purple")
    assert r.status_code == 200
    assert r.json()["id"] == "kit-galaxy-v-strings-purple"


def test_checkout_stage_kit(s):
    origin = BASE_URL
    r = s.post(f"{BASE_URL}/api/payments/checkout", json={
        "items": [{"product_id": "kit-storm-v-strings-blue", "quantity": 1}],
        "origin_url": origin,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert "checkout_url" in data
    assert "stripe" in data["checkout_url"].lower() or "checkout" in data["checkout_url"].lower()


# ---------- Reviews ----------

def test_galaxy_v_seeded_review(s):
    r = s.get(f"{BASE_URL}/api/shop/products/galaxy-v/reviews")
    assert r.status_code == 200
    data = r.json()
    reviews = data if isinstance(data, list) else data.get("reviews", [])
    assert len(reviews) >= 1
    rev = reviews[0]
    photo_url = rev.get("photo_url")
    assert photo_url and photo_url.startswith("/api/files/")
    # Fetch file
    r2 = s.get(f"{BASE_URL}{photo_url}")
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")


def test_galaxy_v_can_review_already(s, auth_headers):
    r = s.get(f"{BASE_URL}/api/shop/products/galaxy-v/can-review", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d.get("already_reviewed") is True
    assert d.get("can_review") is False


def test_storm_v_can_review_purchased(s, auth_headers):
    r = s.get(f"{BASE_URL}/api/shop/products/storm-v/can-review", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d.get("purchased") is True
    assert d.get("can_review") is True


def test_groovwah_can_review_not_purchased(s, auth_headers):
    r = s.get(f"{BASE_URL}/api/shop/products/groovwah/can-review", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d.get("purchased") is False


def test_post_review_forbidden_when_not_purchased(s, auth_headers):
    r = s.post(f"{BASE_URL}/api/shop/products/groovwah/reviews",
               json={"rating": 5, "title": "t", "body": "b"}, headers=auth_headers)
    assert r.status_code == 403


def test_post_review_storm_v_then_duplicate(s, auth_headers):
    # Ensure clean state
    cli = MongoClient(MONGO_URL)
    cli[DB_NAME].reviews.delete_many({"product_id": "storm-v"})
    cli.close()
    r = s.post(f"{BASE_URL}/api/shop/products/storm-v/reviews",
               json={"rating": 4, "title": "Storm", "body": "Great"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("verified") is True
    assert d.get("author") == "GroovLabz Admin"
    # Duplicate
    r2 = s.post(f"{BASE_URL}/api/shop/products/storm-v/reviews",
                json={"rating": 4, "title": "Storm", "body": "Great"}, headers=auth_headers)
    assert r2.status_code == 409


def test_post_review_unauth():
    # Fresh session with no cookies/auth
    r = requests.post(f"{BASE_URL}/api/shop/products/storm-v/reviews",
                      json={"rating": 4, "title": "T", "body": "B"})
    assert r.status_code == 401, f"got {r.status_code}: {r.text[:200]}"


def test_post_review_invalid_rating(s, auth_headers):
    r = s.post(f"{BASE_URL}/api/shop/products/storm-v/reviews",
               json={"rating": 6, "title": "T", "body": "B"}, headers=auth_headers)
    assert r.status_code == 422


# ---------- Uploads ----------

def _tiny_png():
    # Build minimal 1x1 PNG
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
    raw = b"\x00\xff\x00\x00"
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return sig + ihdr + idat + iend


def test_upload_review_photo_png(s, auth_headers):
    files = {"file": ("test.png", _tiny_png(), "image/png")}
    r = s.post(f"{BASE_URL}/api/uploads/review-photo", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "id" in d and "url" in d


def test_upload_rejects_txt(s, auth_headers):
    files = {"file": ("test.txt", b"hello", "text/plain")}
    r = s.post(f"{BASE_URL}/api/uploads/review-photo", files=files, headers=auth_headers)
    assert r.status_code == 400


def test_files_nonexistent_404(s):
    r = s.get(f"{BASE_URL}/api/files/nonexistent")
    assert r.status_code == 404
