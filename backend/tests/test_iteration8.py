"""Iteration 8: Google session auth, AI chat, avatar upload, admin media overrides."""
import os
import io
import json
import time
import uuid
import struct
import zlib
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

ADMIN_EMAIL = "admin@groovlabz.com"
ADMIN_PW = "admin123"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]


def _tiny_png() -> bytes:
    # minimal valid 1x1 png
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\x00\x00")
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="session")
def png_bytes():
    return _tiny_png()


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------------- Google auth / session token ----------------
class TestGoogleAuth:
    def setup_method(self):
        self.uid = f"google-test-{uuid.uuid4().hex[:8]}"
        self.email = f"test.google.{uuid.uuid4().hex[:8]}@example.com"
        self.session_token = f"test_session_{uuid.uuid4().hex}"
        db.users.insert_one({
            "id": self.uid, "email": self.email, "name": "Google Tester",
            "picture": "https://via.placeholder.com/150", "role": "user",
            "auth_provider": "google", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        db.user_sessions.insert_one({
            "user_id": self.uid, "session_token": self.session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc),
        })

    def teardown_method(self):
        db.users.delete_one({"id": self.uid})
        db.user_sessions.delete_many({"session_token": self.session_token})

    def test_me_with_bearer_session(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {self.session_token}"})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == self.email

    def test_me_with_cookie_session(self):
        r = requests.get(f"{API}/auth/me", cookies={"session_token": self.session_token})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == self.email

    def test_expired_session(self):
        expired = f"test_session_exp_{uuid.uuid4().hex}"
        db.user_sessions.insert_one({
            "user_id": self.uid, "session_token": expired,
            "expires_at": datetime.now(timezone.utc) - timedelta(hours=1),
            "created_at": datetime.now(timezone.utc),
        })
        try:
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {expired}"})
            assert r.status_code == 401
            assert "expired" in r.json().get("detail", "").lower()
        finally:
            db.user_sessions.delete_one({"session_token": expired})

    def test_logout_deletes_session(self):
        tok = f"test_session_logout_{uuid.uuid4().hex}"
        db.user_sessions.insert_one({
            "user_id": self.uid, "session_token": tok,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=1),
            "created_at": datetime.now(timezone.utc),
        })
        r = requests.post(f"{API}/auth/logout", cookies={"session_token": tok})
        assert r.status_code == 200
        assert db.user_sessions.find_one({"session_token": tok}) is None

    def test_google_session_missing_header(self):
        r = requests.post(f"{API}/auth/google/session")
        assert r.status_code == 400

    def test_google_session_bogus(self):
        r = requests.post(f"{API}/auth/google/session", headers={"X-Session-ID": "bogus-" + uuid.uuid4().hex})
        assert r.status_code == 401


class TestJwtStillWorks:
    def test_login_and_me(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
        assert r.status_code == 200
        tok = r.json()["token"]
        r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"})
        assert r2.status_code == 200
        assert r2.json()["email"] == ADMIN_EMAIL


# ---------------- AI chat ----------------
class TestAI:
    def _stream(self, session_id, message, mode="support"):
        r = requests.post(f"{API}/ai/chat", json={"session_id": session_id, "message": message, "mode": mode}, stream=True, timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("text/event-stream")
        deltas = []
        for line in r.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                break
            try:
                obj = json.loads(data)
            except Exception:
                continue
            if "delta" in obj:
                deltas.append(obj["delta"])
        return "".join(deltas)

    def test_chat_and_history_persist(self):
        session_id = f"pytest-{uuid.uuid4().hex[:12]}"
        try:
            text = self._stream(session_id, "Which guitar has Bluetooth built in and what does it cost?")
            assert text, "no delta text streamed"
            low = text.lower()
            assert "lightning v" in low or "lightning-v" in low, f"Response missing 'Lightning V': {text[:400]}"
            assert "399" in text, f"Response missing '399': {text[:400]}"
            h = requests.get(f"{API}/ai/history/{session_id}").json()
            assert len(h) == 2
            assert h[0]["role"] == "user"
            assert h[1]["role"] == "assistant"
            # second turn referencing 'that guitar'
            text2 = self._stream(session_id, "Is that guitar good for stage use?")
            assert text2
            h2 = requests.get(f"{API}/ai/history/{session_id}").json()
            assert len(h2) == 4
        finally:
            db.ai_messages.delete_many({"session_id": session_id})

    def test_validation(self):
        r = requests.post(f"{API}/ai/chat", json={"session_id": "pytest-" + uuid.uuid4().hex[:8], "message": "hi", "mode": "bogus"})
        assert r.status_code == 422
        r = requests.post(f"{API}/ai/chat", json={"session_id": "pytest-" + uuid.uuid4().hex[:8], "message": "", "mode": "support"})
        assert r.status_code == 422
        r = requests.post(f"{API}/ai/chat", json={"session_id": "short", "message": "hi", "mode": "support"})
        assert r.status_code == 422


# ---------------- Avatar upload ----------------
class TestAvatar:
    def test_upload_avatar_flow(self, admin_headers, admin_token, png_bytes):
        # unauth
        r = requests.post(f"{API}/uploads/avatar", files={"file": ("a.png", png_bytes, "image/png")})
        assert r.status_code == 401
        # txt rejected
        r = requests.post(f"{API}/uploads/avatar", files={"file": ("a.txt", b"hi", "text/plain")}, headers=admin_headers)
        assert r.status_code == 400
        # png ok
        r = requests.post(f"{API}/uploads/avatar", files={"file": ("a.png", png_bytes, "image/png")}, headers=admin_headers)
        assert r.status_code == 200, r.text
        pic = r.json()["picture"]
        assert pic.startswith("/api/files/")
        # me shows picture
        me = requests.get(f"{API}/auth/me", headers=admin_headers).json()
        assert me.get("picture") == pic
        # file fetch
        r2 = requests.get(f"{BASE}{pic}")
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")
        # review propagates
        rjson = requests.get(f"{API}/shop/products/galaxy-v/reviews").json()
        reviews = rjson["reviews"] if isinstance(rjson, dict) else rjson
        assert any(rv.get("author_picture") == pic for rv in reviews), f"admin review missing pic; reviews={reviews[:2]}"


# ---------------- Admin media overrides ----------------
class TestMediaOverrides:
    def test_full_flow(self, admin_headers, png_bytes):
        # Initial: dict
        r = requests.get(f"{API}/media-overrides")
        assert r.status_code == 200
        assert isinstance(r.json(), dict)

        # Set product override groovwah
        r = requests.put(f"{API}/admin/media/product/groovwah",
                         files={"file": ("g.png", png_bytes, "image/png")}, headers=admin_headers)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["key"] == "product:groovwah"
        assert body["url"].startswith("/api/files/")
        override_url = body["url"]

        # Product get shows override
        p = requests.get(f"{API}/shop/products/groovwah").json()
        assert p["image"] == override_url
        plist = requests.get(f"{API}/shop/products").json()
        gw = next(x for x in plist if x["id"] == "groovwah")
        assert gw["image"] == override_url

        # App override groovbox (leave for frontend test)
        r = requests.put(f"{API}/admin/media/app/groovbox",
                         files={"file": ("gb.png", png_bytes, "image/png")}, headers=admin_headers)
        assert r.status_code == 200, r.text
        ov = requests.get(f"{API}/media-overrides").json()
        assert "app:groovbox" in ov

        # Unknown product
        r = requests.put(f"{API}/admin/media/product/notaproduct",
                         files={"file": ("x.png", png_bytes, "image/png")}, headers=admin_headers)
        assert r.status_code == 404
        # Bundle disallowed
        r = requests.put(f"{API}/admin/media/product/kit-lightning-v-strings-blue",
                         files={"file": ("x.png", png_bytes, "image/png")}, headers=admin_headers)
        assert r.status_code == 404

        # Non-admin
        # Register a fresh user
        email = f"user_{uuid.uuid4().hex[:8]}@ex.com"
        rr = requests.post(f"{API}/auth/register", json={"email": email, "password": "pass1234", "name": "U"})
        assert rr.status_code in (200, 201), rr.text
        user_tok = rr.json()["token"]
        r = requests.put(f"{API}/admin/media/product/groovwah",
                         files={"file": ("x.png", png_bytes, "image/png")},
                         headers={"Authorization": f"Bearer {user_tok}"})
        assert r.status_code == 403

        # Unauth
        r = requests.put(f"{API}/admin/media/product/groovwah",
                         files={"file": ("x.png", png_bytes, "image/png")})
        assert r.status_code == 401

        # Delete groovwah
        r = requests.delete(f"{API}/admin/media/product/groovwah", headers=admin_headers)
        assert r.status_code == 200
        p = requests.get(f"{API}/shop/products/groovwah").json()
        assert p["image"] == "/shop/groovwah.jpg"

    def test_zzz_cleanup_app_groovbox(self, admin_headers):
        # runs after test_full_flow alphabetically; leaves clean state
        # Actually leave in place for frontend test — will delete in module teardown
        pass


@pytest.fixture(scope="module", autouse=True)
def _final_cleanup(admin_headers):
    yield
    try:
        requests.delete(f"{API}/admin/media/app/groovbox", headers=admin_headers)
        requests.delete(f"{API}/admin/media/product/groovwah", headers=admin_headers)
    except Exception:
        pass
