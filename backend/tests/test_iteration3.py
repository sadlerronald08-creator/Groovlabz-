"""Iteration 3 backend tests: brute-force lockout, new signature guitars, checkout, static assets."""
import os
import uuid
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://groov-nexus.preview.emergentagent.com").rstrip("/")

# Mongo cleanup helper
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

def _read_backend_env():
    env = {}
    try:
        with open("/app/backend/.env") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

_env = _read_backend_env()
MONGO_URL = _env.get("MONGO_URL", MONGO_URL)
DB_NAME = _env.get("DB_NAME", DB_NAME)


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module", autouse=True)
def cleanup_login_attempts():
    async def _clean():
        c = AsyncIOMotorClient(MONGO_URL)
        db = c[DB_NAME]
        await db.login_attempts.delete_many({"identifier": {"$regex": "lock-|:cleartest-|:regadmin-"}})
        c.close()
    asyncio.get_event_loop().run_until_complete(_clean())
    yield
    asyncio.get_event_loop().run_until_complete(_clean())


# ---- Shop products ---------
class TestShop:
    def test_products_list_has_new_guitars(self, api):
        r = api.get(f"{BASE_URL}/api/shop/products")
        assert r.status_code == 200
        products = r.json()
        assert len(products) == 6
        by_id = {p["id"]: p for p in products}
        for pid in ("galaxy-v", "lightning-v"):
            assert pid in by_id
            p = by_id[pid]
            assert p["price"] == 249.0
            assert p["category"] == "Signature Guitars"
            assert p["fit"] == "contain"

    def test_get_single_galaxy_v(self, api):
        r = api.get(f"{BASE_URL}/api/shop/products/galaxy-v")
        assert r.status_code == 200
        assert r.json()["id"] == "galaxy-v"


# ---- Static assets --------
class TestStatic:
    @pytest.mark.parametrize("path", [
        "/shop/galaxy-v.jpg",
        "/jamnow/flying-v.png",
        "/badges/app-store.svg",
        "/badges/google-play.png",
    ])
    def test_asset(self, api, path):
        r = api.get(f"{BASE_URL}{path}")
        assert r.status_code == 200, f"{path} => {r.status_code}"


# ---- Checkout -----------
class TestCheckout:
    def test_checkout_lightning_v(self, api):
        r = api.post(f"{BASE_URL}/api/payments/checkout", json={
            "items": [{"product_id": "lightning-v", "quantity": 1}],
            "origin_url": BASE_URL,
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "checkout_url" in data and "session_id" in data
        assert "stripe.com" in data["checkout_url"]


# ---- Brute-force lockout ---------
class TestLockout:
    def test_lockout_flow(self, api):
        email = f"lock-{uuid.uuid4().hex[:8]}@test.com"
        expected_left = [4, 3, 2, 1]
        for i, left in enumerate(expected_left):
            r = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
            assert r.status_code == 401, f"attempt {i+1}: {r.status_code} {r.text}"
            detail = r.json().get("detail", "")
            assert f"{left} attempt" in detail, f"attempt {i+1}: detail={detail!r}"
        # 5th attempt -> lockout
        r5 = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
        assert r5.status_code == 429
        d5 = r5.json().get("detail", "")
        assert "locked for 15 minutes" in d5.lower() or "locked for 15" in d5
        assert r5.headers.get("Retry-After") == "900"
        # 6th attempt -> already locked message
        r6 = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
        assert r6.status_code == 429
        d6 = r6.json().get("detail", "")
        assert "try again in" in d6.lower()

    def test_admin_login_still_works(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@groovlabz.com", "password": "admin123"
        })
        assert r.status_code == 200, r.text
        assert "token" in r.json()

    def test_wrong_then_correct_clears_counter(self, api):
        email = f"cleartest-{uuid.uuid4().hex[:6]}@test.com"
        password = "GoodPass123!"
        # register
        r = api.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": password, "name": "Clear Test"
        })
        assert r.status_code == 200, r.text
        # wrong
        r1 = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "wrong"})
        assert r1.status_code == 401
        # correct
        r2 = api.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        assert r2.status_code == 200
        # verify login_attempts doc removed
        async def _check():
            c = AsyncIOMotorClient(MONGO_URL)
            db = c[DB_NAME]
            docs = await db.login_attempts.find({"identifier": {"$regex": f":{email}$"}}).to_list(10)
            c.close()
            return docs
        docs = asyncio.get_event_loop().run_until_complete(_check())
        assert docs == [], f"login_attempts not cleared: {docs}"
