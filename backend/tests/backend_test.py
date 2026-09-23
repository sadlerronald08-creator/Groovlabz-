"""Backend regression tests for Groove Sesh API."""
import os
import io
import time
import uuid
import struct
import wave
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://jam-now-studio.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _rand_email(prefix="tester"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:10]}@groovelabs.io"


def _mk_wav_bytes(seconds=0.2, freq=440, rate=8000):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        nframes = int(seconds * rate)
        for i in range(nframes):
            val = int(32767 * 0.2)
            w.writeframesraw(struct.pack("<h", val if i % 20 < 10 else -val))
    return buf.getvalue()


@pytest.fixture(scope="module")
def user_a():
    email = _rand_email("a")
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Test1234!", "name": "User A"}, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": "Test1234!", "token": d["session_token"], "user": d["user"]}


@pytest.fixture(scope="module")
def user_b():
    email = _rand_email("b")
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Test1234!", "name": "User B"}, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "password": "Test1234!", "token": d["session_token"], "user": d["user"]}


def h(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Health ----
def test_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("message") == "Groove Sesh API"


# ---- Auth ----
class TestAuth:
    def test_register_returns_token(self, user_a):
        assert user_a["token"]
        assert user_a["user"]["email"] == user_a["email"].lower()
        assert user_a["user"]["id"].startswith("user_")

    def test_register_duplicate(self, user_a):
        r = requests.post(f"{API}/auth/register", json={"email": user_a["email"], "password": "x", "name": "x"}, timeout=15)
        assert r.status_code == 400

    def test_login_success(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": user_a["password"]}, timeout=15)
        assert r.status_code == 200
        assert "session_token" in r.json()

    def test_login_bad_password(self, user_a):
        r = requests.post(f"{API}/auth/login", json={"email": user_a["email"], "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, user_a):
        r = requests.get(f"{API}/auth/me", headers=h(user_a["token"]), timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == user_a["email"].lower()

    def test_me_without_token_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_sessions_without_token_401(self):
        r = requests.get(f"{API}/sessions", timeout=15)
        assert r.status_code == 401

    def test_logout(self):
        email = _rand_email("logout")
        reg = requests.post(f"{API}/auth/register", json={"email": email, "password": "x1234567", "name": "L"}, timeout=15)
        tok = reg.json()["session_token"]
        r = requests.post(f"{API}/auth/logout", headers=h(tok), timeout=15)
        assert r.status_code == 200
        # token now invalidated
        r2 = requests.get(f"{API}/auth/me", headers=h(tok), timeout=15)
        assert r2.status_code == 401


# ---- Sessions ----
class TestSessions:
    def test_create_and_get_list(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_S1", "bpm": 100, "count_in": True}, timeout=15)
        assert r.status_code == 200
        s = r.json()
        assert s["title"] == "TEST_S1" and s["bpm"] == 100
        assert s["track_count"] == 0
        sid = s["id"]

        r2 = requests.get(f"{API}/sessions", headers=h(user_a["token"]), timeout=15)
        assert r2.status_code == 200
        assert any(x["id"] == sid for x in r2.json())

        r3 = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15)
        assert r3.status_code == 200
        body = r3.json()
        assert "tracks" in body and isinstance(body["tracks"], list)

    def test_patch_metronome(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_S2"}, timeout=15)
        sid = r.json()["id"]
        p = requests.patch(f"{API}/sessions/{sid}", headers=h(user_a["token"]), json={"metronome": True, "bpm": 120}, timeout=15)
        assert p.status_code == 200
        get = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15).json()
        assert get["metronome"] is True and get["bpm"] == 120

    def test_delete_session_soft(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_DEL"}, timeout=15)
        sid = r.json()["id"]
        d = requests.delete(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15)
        assert d.status_code == 200
        lst = requests.get(f"{API}/sessions", headers=h(user_a["token"]), timeout=15).json()
        assert not any(x["id"] == sid for x in lst)
        # Also GET by id should 404
        g = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15)
        assert g.status_code == 404

    def test_user_isolation_sessions(self, user_a, user_b):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_ISO"}, timeout=15)
        sid = r.json()["id"]
        # user B cannot get
        g = requests.get(f"{API}/sessions/{sid}", headers=h(user_b["token"]), timeout=15)
        assert g.status_code == 404
        # user B cannot patch
        p = requests.patch(f"{API}/sessions/{sid}", headers=h(user_b["token"]), json={"bpm": 200}, timeout=15)
        assert p.status_code == 404
        # user B cannot delete (matched_count=0 but returns ok in code; verify not actually deleted)
        d = requests.delete(f"{API}/sessions/{sid}", headers=h(user_b["token"]), timeout=15)
        # Endpoint returns 200 even when nothing matched — verify session still exists for A
        still = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15)
        assert still.status_code == 200


# ---- Tracks + Audio ----
class TestTracksAndAudio:
    @pytest.fixture(scope="class")
    def session_and_track(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_TRK"}, timeout=15)
        sid = r.json()["id"]
        wav = _mk_wav_bytes()
        files = {"file": ("take.wav", wav, "audio/wav")}
        data = {"name": "Take 1", "source": "mic", "duration": "0.2", "color": "0"}
        up = requests.post(f"{API}/sessions/{sid}/tracks", headers=h(user_a["token"]), data=data, files=files, timeout=60)
        assert up.status_code == 200, up.text
        t = up.json()
        assert t["audio_url"].startswith("/api/audio/")
        assert t["name"] == "Take 1"
        return {"sid": sid, "track": t, "wav_len": len(wav)}

    def test_upload_track(self, session_and_track):
        assert session_and_track["track"]["id"]

    def test_session_includes_track(self, user_a, session_and_track):
        sid = session_and_track["sid"]
        g = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15).json()
        assert len(g["tracks"]) == 1
        assert g["tracks"][0]["id"] == session_and_track["track"]["id"]

    def test_audio_download_owner(self, user_a, session_and_track):
        tid = session_and_track["track"]["id"]
        r = requests.get(f"{API}/audio/{tid}?token={user_a['token']}", timeout=30)
        assert r.status_code == 200
        assert len(r.content) == session_and_track["wav_len"]
        assert "audio" in r.headers.get("content-type", "").lower()

    def test_audio_download_other_user_forbidden(self, user_b, session_and_track):
        tid = session_and_track["track"]["id"]
        r = requests.get(f"{API}/audio/{tid}?token={user_b['token']}", timeout=15)
        assert r.status_code in (401, 404)

    def test_audio_download_no_token_401(self, session_and_track):
        tid = session_and_track["track"]["id"]
        r = requests.get(f"{API}/audio/{tid}", timeout=15)
        assert r.status_code == 401

    def test_patch_track(self, user_a, session_and_track):
        tid = session_and_track["track"]["id"]
        p = requests.patch(f"{API}/tracks/{tid}", headers=h(user_a["token"]),
                           json={"volume": 0.5, "muted": True, "solo": False,
                                 "effects": {"eq": True, "reverb": False, "gain": 1.5, "trim_start": 0.1, "trim_end": 0.2}},
                           timeout=15)
        assert p.status_code == 200
        body = p.json()
        assert body["volume"] == 0.5 and body["muted"] is True
        assert body["effects"]["eq"] is True and body["effects"]["gain"] == 1.5

    def test_patch_track_other_user_forbidden(self, user_b, session_and_track):
        tid = session_and_track["track"]["id"]
        p = requests.patch(f"{API}/tracks/{tid}", headers=h(user_b["token"]), json={"volume": 0.1}, timeout=15)
        assert p.status_code == 404

    def test_delete_track(self, user_a, session_and_track):
        # Add a second track to delete
        sid = session_and_track["sid"]
        wav = _mk_wav_bytes()
        files = {"file": ("t2.wav", wav, "audio/wav")}
        data = {"name": "Take 2", "source": "mic", "duration": "0.2", "color": "1"}
        up = requests.post(f"{API}/sessions/{sid}/tracks", headers=h(user_a["token"]), data=data, files=files, timeout=60)
        tid = up.json()["id"]
        d = requests.delete(f"{API}/tracks/{tid}", headers=h(user_a["token"]), timeout=15)
        assert d.status_code == 200
        # Verify soft delete - not in session tracks
        g = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15).json()
        assert not any(t["id"] == tid for t in g["tracks"])
