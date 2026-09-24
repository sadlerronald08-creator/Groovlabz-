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
    assert r.json().get("message") == "GroovSesh API"


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



# ---- Reorder ----
class TestReorder:
    def _make_session_with_tracks(self, token, n=3):
        r = requests.post(f"{API}/sessions", headers=h(token), json={"title": "TEST_REORDER"}, timeout=15)
        sid = r.json()["id"]
        ids = []
        for i in range(n):
            wav = _mk_wav_bytes()
            files = {"file": (f"t{i}.wav", wav, "audio/wav")}
            data = {"name": f"Take {i}", "source": "mic", "duration": "0.2", "color": str(i)}
            up = requests.post(f"{API}/sessions/{sid}/tracks", headers=h(token), data=data, files=files, timeout=60)
            assert up.status_code == 200, up.text
            ids.append(up.json()["id"])
        return sid, ids

    def test_reorder_persists(self, user_a):
        sid, ids = self._make_session_with_tracks(user_a["token"], n=3)
        # reverse
        new_order = list(reversed(ids))
        r = requests.post(f"{API}/sessions/{sid}/reorder", headers=h(user_a["token"]), json={"track_ids": new_order}, timeout=15)
        assert r.status_code == 200
        g = requests.get(f"{API}/sessions/{sid}", headers=h(user_a["token"]), timeout=15).json()
        got = [t["id"] for t in g["tracks"]]
        assert got == new_order, f"expected {new_order}, got {got}"

    def test_reorder_other_user_404(self, user_a, user_b):
        sid, ids = self._make_session_with_tracks(user_a["token"], n=2)
        r = requests.post(f"{API}/sessions/{sid}/reorder", headers=h(user_b["token"]),
                          json={"track_ids": list(reversed(ids))}, timeout=15)
        assert r.status_code == 404


# ---- Mixdown ----
class TestMixdown:
    @pytest.fixture(scope="class")
    def session_with_two(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_MIX"}, timeout=15)
        sid = r.json()["id"]
        for i in range(2):
            wav = _mk_wav_bytes(seconds=0.3, freq=440 + i * 220)
            files = {"file": (f"m{i}.wav", wav, "audio/wav")}
            data = {"name": f"Take {i}", "source": "mic", "duration": "0.3", "color": str(i)}
            up = requests.post(f"{API}/sessions/{sid}/tracks", headers=h(user_a["token"]), data=data, files=files, timeout=60)
            assert up.status_code == 200, up.text
        return sid

    def test_mixdown_mp3(self, user_a, session_with_two):
        r = requests.post(f"{API}/sessions/{session_with_two}/mixdown?format=mp3",
                          headers=h(user_a["token"]), timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["format"] == "mp3"
        assert body["size"] > 0
        assert body["audio_url"].startswith("/api/mixdown/")

        # download
        g = requests.get(f"{BASE_URL}{body['audio_url']}&token={user_a['token']}", timeout=60)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(g.content) > 0

    def test_mixdown_wav(self, user_a, session_with_two):
        r = requests.post(f"{API}/sessions/{session_with_two}/mixdown?format=wav",
                          headers=h(user_a["token"]), timeout=120)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["format"] == "wav"
        assert body["size"] > 0

        g = requests.get(f"{API}/mixdown/{session_with_two}?fmt=wav&token={user_a['token']}", timeout=60)
        assert g.status_code == 200
        assert g.headers.get("content-type", "").startswith("audio/wav")
        assert len(g.content) > 0

    def test_mixdown_no_tracks_400(self, user_a):
        r = requests.post(f"{API}/sessions", headers=h(user_a["token"]), json={"title": "TEST_EMPTY"}, timeout=15)
        sid = r.json()["id"]
        m = requests.post(f"{API}/sessions/{sid}/mixdown?format=mp3", headers=h(user_a["token"]), timeout=30)
        assert m.status_code == 400

    def test_get_mixdown_no_token_401(self, user_a, session_with_two):
        # ensure mixdown exists
        requests.post(f"{API}/sessions/{session_with_two}/mixdown?format=mp3", headers=h(user_a["token"]), timeout=120)
        r = requests.get(f"{API}/mixdown/{session_with_two}?fmt=mp3", timeout=30)
        assert r.status_code == 401

    def test_get_mixdown_cross_user_404(self, user_a, user_b, session_with_two):
        # user_a already generated mp3 mixdown in earlier test; user_b should get 404
        r = requests.get(f"{API}/mixdown/{session_with_two}?fmt=mp3&token={user_b['token']}", timeout=30)
        assert r.status_code == 404

    def test_mixdown_cross_user_404(self, user_a, user_b, session_with_two):
        r = requests.post(f"{API}/sessions/{session_with_two}/mixdown?format=mp3",
                          headers=h(user_b["token"]), timeout=30)
        assert r.status_code == 404
