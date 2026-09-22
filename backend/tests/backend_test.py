"""GroovLabz backend API tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://groov-nexus.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@groovlabz.com"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def new_user(s):
    email = f"test_user_{uuid.uuid4().hex[:8]}@groovlabz.com"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "Test U"})
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "password": "pass1234", "token": data["token"], "id": data["id"], "data": data}


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth ----------
def test_register_returns_user_and_token(new_user):
    d = new_user["data"]
    assert d["email"] == new_user["email"]
    assert d["role"] == "user"
    assert d["token"]


def test_me_with_bearer(s, new_user):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {new_user['token']}"})
    assert r.status_code == 200
    assert r.json()["email"] == new_user["email"]


def test_admin_login(admin_token):
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongwrong"})
    assert r.status_code == 401


# ---------- Shop ----------
def test_products_list():
    r = requests.get(f"{API}/shop/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) == 4
    for p in products:
        for k in ("id", "name", "price", "image", "specs", "category"):
            assert k in p


def test_product_by_id():
    r = requests.get(f"{API}/shop/products/groovpuck-bt")
    assert r.status_code == 200
    assert r.json()["id"] == "groovpuck-bt"


def test_product_unknown_404():
    r = requests.get(f"{API}/shop/products/does-not-exist")
    assert r.status_code == 404


# ---------- Checkout ----------
def test_checkout_creates_session(new_user):
    r = requests.post(f"{API}/payments/checkout",
                      headers={"Authorization": f"Bearer {new_user['token']}"},
                      json={"items": [{"product_id": "groovpuck-bt", "quantity": 1}],
                            "origin_url": "https://example.com"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["checkout_url"].startswith("http")
    assert d["session_id"]
    # verify status
    r2 = requests.get(f"{API}/payments/status/{d['session_id']}")
    assert r2.status_code == 200
    st = r2.json()
    assert st["status"] == "initiated"
    assert st["payment_status"] == "pending"


def test_checkout_empty_400():
    r = requests.post(f"{API}/payments/checkout",
                      json={"items": [], "origin_url": "https://example.com"})
    assert r.status_code == 400


def test_checkout_unknown_product_400():
    r = requests.post(f"{API}/payments/checkout",
                      json={"items": [{"product_id": "nope", "quantity": 1}],
                            "origin_url": "https://example.com"})
    assert r.status_code == 400


# ---------- Contact ----------
def test_contact_stores_message():
    r = requests.post(f"{API}/contact", json={
        "name": "TEST_John", "email": "test@example.com",
        "subject": "Hi", "message": "Hello there"
    })
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "received"
    assert d["id"]


# ---------- Activity ----------
def test_activity_log_and_list(new_user):
    h = {"Authorization": f"Bearer {new_user['token']}"}
    r = requests.post(f"{API}/activity", headers=h,
                      json={"app_id": "groovsesh", "action": "connect"})
    assert r.status_code == 200
    r2 = requests.get(f"{API}/activity/mine", headers=h)
    assert r2.status_code == 200
    items = r2.json()
    assert any(i["app_id"] == "groovsesh" for i in items)


# ---------- Account dashboard ----------
def test_account_dashboard(new_user):
    h = {"Authorization": f"Bearer {new_user['token']}"}
    r = requests.get(f"{API}/account/dashboard", headers=h)
    assert r.status_code == 200
    d = r.json()
    for k in ("user", "orders", "activity", "connected_apps", "stats"):
        assert k in d
    for sk in ("orders_count", "total_spent", "apps_connected"):
        assert sk in d["stats"]


def test_orders_mine(new_user):
    h = {"Authorization": f"Bearer {new_user['token']}"}
    r = requests.get(f"{API}/orders/mine", headers=h)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_dashboard_requires_auth():
    r = requests.get(f"{API}/account/dashboard")
    assert r.status_code == 401
