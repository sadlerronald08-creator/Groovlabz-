"""Hum-to-Drums analysis tests on synthetic taps (no ffmpeg needed: WAV input)."""
import io
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hum_to_drums import hum_to_drums, estimate_bpm, onset_envelope  # noqa: E402


def _taps_wav(bpm=120, seconds=6.0, sr=22050, low_every=2):
    n = int(sr * seconds)
    x = np.random.randn(n) * 0.002
    beat = 60.0 / bpm
    t_tap = np.arange(int(sr * 0.12)) / sr
    i = 0
    t = 0.0
    while t < seconds - 0.2:
        start = int(t * sr)
        if i % low_every == 0:
            tap = np.sin(2 * np.pi * 90 * t_tap) * np.exp(-t_tap * 30)
        else:
            tap = np.random.randn(len(t_tap)) * np.exp(-t_tap * 45)
        x[start : start + len(tap)] += tap
        t += beat
        i += 1
    pcm = (x / np.max(np.abs(x)) * 20000).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def test_detects_tempo_and_renders_track():
    res = hum_to_drums(_taps_wav(bpm=120), "wav")
    assert 112 <= res["bpm"] <= 128 or 56 <= res["bpm"] <= 64
    assert res["onsets"] >= 8
    assert res["kicks"] >= 1 and res["snares"] >= 1
    with wave.open(io.BytesIO(res["wav"])) as w:
        assert w.getframerate() == 44100
        assert w.getnframes() / w.getframerate() > 4.0


def test_rejects_silence():
    sr = 22050
    pcm = (np.random.randn(sr * 4) * 20).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
    try:
        hum_to_drums(buf.getvalue(), "wav")
        assert False, "expected ValueError"
    except ValueError as e:
        assert "groove" in str(e).lower() or "quiet" in str(e).lower()


def test_bpm_estimator_on_clean_pulse():
    sr = 22050
    x = np.zeros(sr * 8)
    for k in range(16):
        i = int(k * 0.5 * sr)
        x[i : i + 400] += np.hanning(400)
    flux, _, hop = onset_envelope(x)
    bpm = estimate_bpm(flux, hop)
    assert bpm in (120.0, 60.0) or abs(bpm - 120) <= 2
