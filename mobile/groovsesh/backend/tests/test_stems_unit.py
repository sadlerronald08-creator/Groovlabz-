"""Unit test for the GroovMash stem packaging (no network, no ffmpeg needed for WAV input)."""
import io
import os
import sys
import wave
import zipfile
import json

import numpy as np

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "groovsesh_unit")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import server  # noqa: E402


def _wav_bytes(seconds=0.5, freq=440.0, sr=44100):
    t = np.arange(int(sr * seconds)) / sr
    pcm = (np.sin(2 * np.pi * freq * t) * 12000).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def test_do_stems_packs_named_wavs(monkeypatch):
    store = {"a.wav": _wav_bytes(0.5, 440), "b.wav": _wav_bytes(0.8, 660)}
    monkeypatch.setattr(server, "get_object", lambda path: (store[path], "audio/wav"))
    tracks = [
        {"name": "Lead Guitar", "storage_path": "a.wav", "volume": 1.0, "effects": {}},
        {"name": "Vox/Take 2", "storage_path": "b.wav", "volume": 0.5, "effects": {"trim_start": 0.1}},
    ]
    data = server._do_stems(tracks)
    zf = zipfile.ZipFile(io.BytesIO(data))
    names = zf.namelist()
    assert "01 - Lead Guitar.wav" in names
    assert "02 - Vox_Take 2.wav" in names
    manifest = json.loads(zf.read("groovmash.json"))
    assert manifest == {"source": "GroovSesh", "format": "stems-v1", "stems": 2}
    with wave.open(io.BytesIO(zf.read("02 - Vox_Take 2.wav"))) as w:
        assert abs(w.getnframes() / w.getframerate() - 0.7) < 0.02


def test_do_stems_raises_when_nothing_decodable(monkeypatch):
    monkeypatch.setattr(server, "get_object", lambda path: (b"not audio", "audio/wav"))
    try:
        server._do_stems([{"name": "x", "storage_path": "p"}])
        assert False, "expected ValueError"
    except ValueError:
        pass
