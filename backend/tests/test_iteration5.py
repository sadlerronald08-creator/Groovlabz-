"""Iteration 5: shop expansion (15 products), guitars gallery+sheet, checkout origin, send_receipt guard."""
import asyncio
import os
import sys
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://groov-nexus.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# ---- Shop catalog ----------
def test_products_list_15():
    r = requests.get(f"{API}/shop/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) == 15, f"expected 15, got {len(products)}"
    by_id = {p["id"]: p for p in products}
    assert by_id["lightning-v"]["price"] == 399
    assert by_id["galaxy-v"]["price"] == 299
    assert by_id["storm-v"]["price"] == 299
    for gid in ("lightning-v", "galaxy-v", "storm-v"):
        p = by_id[gid]
        assert "gallery" in p and len(p["gallery"]) == 4, f"{gid} gallery"
        for g in p["gallery"]:
            assert "src" in g and "label" in g
        assert isinstance(p.get("sheet"), dict) and "Body" in p["sheet"]

def test_product_by_id_storm_v():
    r = requests.get(f"{API}/shop/products/storm-v")
    assert r.status_code == 200
    assert r.json()["id"] == "storm-v"

def test_product_unknown_404():
    r = requests.get(f"{API}/shop/products/nope")
    assert r.status_code == 404


# ---- Static images (served by frontend public/) ----------
@pytest.mark.parametrize("path", [
    "/shop/lightning-v.jpg", "/shop/storm-v.jpg", "/shop/galaxy-v-headstock.jpg",
    "/shop/groovmic-bt.jpg", "/shop/groovwah.jpg",
    "/shop/groovamp-12.jpg", "/shop/groovamp-10.jpg", "/shop/groovamp-7.jpg",
    "/shop/strings-green.jpg", "/shop/strings-purple.jpg", "/shop/strings-blue.jpg",
])
def test_static_image_200(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"{path} -> {r.status_code}"
    assert int(r.headers.get("content-length", "1")) > 0


# ---- Checkout stores origin ----------
def test_checkout_stores_origin_and_amount():
    payload = {
        "items": [
            {"product_id": "storm-v", "quantity": 1},
            {"product_id": "strings-blue", "quantity": 2},
        ],
        "origin_url": BASE_URL,
    }
    r = requests.post(f"{API}/payments/checkout", json=payload)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "checkout.stripe.com" in d["checkout_url"]
    sid = d["session_id"]
    # status endpoint returns pending
    r2 = requests.get(f"{API}/payments/status/{sid}")
    assert r2.status_code == 200
    st = r2.json()
    assert st["payment_status"] == "pending"

    # verify mongo doc via subprocess-style: query via server internals not possible from here.
    # Instead re-fetch: we can add an assertion on amount via /orders/mine? Not authed.
    # We'll check via async mongo directly.
    import motor.motor_asyncio
    async def check():
        client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
        d = client[os.environ.get('DB_NAME', 'test_database')]
        doc = await d.payment_transactions.find_one({"session_id": sid})
        client.close()
        return doc
    doc = asyncio.get_event_loop().run_until_complete(check()) if not asyncio.get_event_loop().is_running() else asyncio.run(check())
    assert doc is not None
    assert doc["origin"] == BASE_URL.rstrip("/")
    expected = 299 + 2 * 14.99
    assert abs(doc["amount"] - expected) < 0.01
    assert not doc.get("receipt_sent")


# ---- send_receipt guard ----------
def test_send_receipt_sets_flag_and_is_idempotent():
    # Insert synthetic doc + call send_receipt directly.
    sys.path.insert(0, "/app/backend")
    import server  # noqa
    session_id = f"cs_test_receipt_{uuid.uuid4().hex[:8]}"

    async def run():
        # Find admin
        admin = await server.db.users.find_one({"email": "admin@groovlabz.com"})
        assert admin, "admin user missing"
        await server.db.payment_transactions.insert_one({
            "session_id": session_id,
            "user_id": admin["id"],
            "origin": BASE_URL,
            "items": [{"product_id": "galaxy-v", "quantity": 1}],
            "amount": 299.0,
            "currency": "usd",
            "status": "completed",
            "payment_status": "paid",
        })
        try:
            await server.send_receipt(session_id, "buyer@example.com")
            doc = await server.db.payment_transactions.find_one({"session_id": session_id})
            assert doc.get("receipt_sent") is True
            assert doc.get("buyer_email") == "buyer@example.com"
            # second call should be a no-op (still True, no exception)
            await server.send_receipt(session_id, "buyer@example.com")
            doc2 = await server.db.payment_transactions.find_one({"session_id": session_id})
            assert doc2.get("receipt_sent") is True
        finally:
            await server.db.payment_transactions.delete_one({"session_id": session_id})

    asyncio.run(run())
