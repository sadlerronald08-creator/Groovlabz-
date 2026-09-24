"""Hum-to-Drums: turn a hummed/tapped groove into a drum track locked to the detected tempo."""
from io import BytesIO
import math
import os
import wave

import numpy as np

SR = 22050
OUT_SR = 44100


def decode_to_mono(content: bytes, ext: str | None) -> np.ndarray:
    from pydub import AudioSegment

    seg = AudioSegment.from_file(BytesIO(content), format=ext)
    seg = seg.set_channels(1).set_frame_rate(SR)
    x = np.array(seg.get_array_of_samples()).astype(np.float32)
    peak = float(np.max(np.abs(x))) if x.size else 0.0
    full_scale = float(2 ** (8 * seg.sample_width - 1))
    if peak / full_scale < 0.02:
        raise ValueError("That was too quiet — hum or tap closer to the mic")
    return x / peak if peak > 0 else x


def onset_envelope(x: np.ndarray, hop: int = 220):
    n = max(1, (len(x) - 1024) // hop)
    env = np.zeros(n)
    low = np.zeros(n)
    win = np.hanning(1024)
    for i in range(n):
        frame = x[i * hop : i * hop + 1024] * win
        spec = np.abs(np.fft.rfft(frame))
        env[i] = np.log1p(spec.sum())
        low[i] = spec[: int(200 * 1024 / SR)].sum() / (spec.sum() + 1e-9)
    flux = np.maximum(np.diff(env, prepend=env[0]), 0)
    flux = np.convolve(flux, np.ones(3) / 3, mode="same")
    return flux, low, hop


def pick_onsets(flux: np.ndarray, hop: int, min_gap_s: float = 0.11):
    if flux.size == 0 or flux.max() <= 0:
        return np.array([], dtype=int)
    thresh = np.median(flux) + 1.2 * np.std(flux)
    gap = int(min_gap_s * SR / hop)
    idx = []
    last = -gap
    for i in range(1, len(flux) - 1):
        if flux[i] >= thresh and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1] and i - last >= gap:
            idx.append(i)
            last = i
    return np.array(idx, dtype=int)


def estimate_bpm(flux: np.ndarray, hop: int, lo: int = 60, hi: int = 180) -> float:
    fps = SR / hop
    f = flux - flux.mean()
    ac = np.correlate(f, f, mode="full")[len(f) - 1 :]
    best_bpm, best_val = 100.0, -1.0
    for bpm in range(lo, hi + 1):
        lag = int(round(fps * 60.0 / bpm))
        if lag <= 0 or lag >= len(ac):
            continue
        val = ac[lag] + 0.5 * ac[lag * 2] if lag * 2 < len(ac) else ac[lag]
        if val > best_val:
            best_val, best_bpm = val, float(bpm)
    return best_bpm


def _env(n, decay):
    return np.exp(-np.arange(n) / (OUT_SR * decay))


_SAMPLE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "drums")
_SAMPLES: dict = {}


def _load_sample(name: str):
    if name in _SAMPLES:
        return _SAMPLES[name]
    path = os.path.join(_SAMPLE_DIR, f"{name}.wav")
    data = None
    if os.path.exists(path):
        with wave.open(path, "rb") as w:
            raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
            if w.getnchannels() > 1:
                raw = raw.reshape(-1, w.getnchannels()).mean(axis=1)
            if w.getframerate() != OUT_SR:
                idx = np.linspace(0, len(raw) - 1, int(len(raw) * OUT_SR / w.getframerate()))
                raw = np.interp(idx, np.arange(len(raw)), raw).astype(np.float32)
            peak = float(np.max(np.abs(raw))) or 1.0
            data = raw / peak
    _SAMPLES[name] = data
    return data


# Real recorded acoustic-kit samples (Tone.js audio set, MIT) with a modelled fallback if a file is missing.
def kick(vel=1.0):
    s = _load_sample("kick")
    if s is not None:
        return s * vel
    n = int(OUT_SR * 0.45)
    t = np.arange(n) / OUT_SR
    freq = 55 + 110 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(freq) / OUT_SR) * _env(n, 0.18)
    click = np.random.randn(n) * _env(n, 0.004) * 0.35
    return (body + click) * vel


def snare(vel=1.0):
    s = _load_sample("snare")
    if s is not None:
        return s * vel
    n = int(OUT_SR * 0.3)
    t = np.arange(n) / OUT_SR
    tone = (np.sin(2 * np.pi * 185 * t) + 0.6 * np.sin(2 * np.pi * 330 * t)) * _env(n, 0.06)
    noise = np.random.randn(n)
    noise = noise - np.convolve(noise, np.ones(9) / 9, mode="same")
    snap = noise * _env(n, 0.09) * 0.9
    return (tone * 0.7 + snap) * vel


def hat(vel=1.0, open_=False):
    s = _load_sample("hihat")
    if s is not None:
        if not open_:
            n = min(len(s), int(OUT_SR * 0.12))
            return s[:n] * _env(n, 0.05) * vel
        return s * vel
    n = int(OUT_SR * (0.25 if open_ else 0.08))
    noise = np.random.randn(n)
    noise = noise - np.convolve(noise, np.ones(15) / 15, mode="same")
    return noise * _env(n, 0.09 if open_ else 0.025) * 0.5 * vel


def build_pattern(onsets_s, low_ratio, bpm: float, length_s: float):
    beat = 60.0 / bpm
    step = beat / 4
    steps = int(math.ceil(max(length_s, beat * 8) / step))
    steps = int(math.ceil(steps / 16) * 16)
    grid = {}
    for t, lr in zip(onsets_s, low_ratio):
        s = int(round(t / step)) % steps
        kind = "kick" if lr > 0.35 else "snare"
        grid[s] = kind if s not in grid or kind == "kick" else grid[s]
    if not any(v == "kick" for v in grid.values()):
        for s in range(0, steps, 8):
            grid.setdefault(s, "kick")
    if not any(v == "snare" for v in grid.values()):
        for s in range(4, steps, 8):
            grid.setdefault(s, "snare")
    return grid, steps, step


def render(grid, steps, step, tail=0.5) -> bytes:
    total = int(OUT_SR * (steps * step + tail))
    out = np.zeros(total)
    k, s = kick(), snare()

    def place(sample, at):
        i = int(at * OUT_SR)
        seg = sample[: max(0, total - i)]
        out[i : i + len(seg)] += seg

    for st in range(steps):
        t = st * step
        if st % 2 == 0:
            place(hat(0.6 if st % 4 else 0.85, open_=(st % 16 == 14)), t)
        kind = grid.get(st)
        if kind == "kick":
            place(k, t)
        elif kind == "snare":
            place(s, t)
    peak = np.max(np.abs(out)) or 1.0
    pcm = (out / peak * 0.9 * 32767).astype(np.int16)
    buf = BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_SR)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def hum_to_drums(content: bytes, ext: str | None):
    x = decode_to_mono(content, ext)
    if len(x) < SR * 1.5:
        raise ValueError("Hum or tap for at least two seconds")
    flux, low, hop = onset_envelope(x)
    if flux.size == 0 or np.max(flux) < 4.0 * (np.median(flux) + 1e-6):
        raise ValueError("Couldn't hear a groove — hum or tap louder and steadier")
    idx = pick_onsets(flux, hop)
    if len(idx) < 4:
        raise ValueError("Couldn't hear a groove — hum or tap louder and steadier")
    bpm = estimate_bpm(flux, hop)
    onsets_s = idx * hop / SR
    grid, steps, step = build_pattern(onsets_s, low[idx], bpm, len(x) / SR)
    wav = render(grid, steps, step)
    return {
        "wav": wav,
        "bpm": int(round(bpm)),
        "onsets": int(len(idx)),
        "bars": steps // 16,
        "duration": steps * step + 0.5,
        "kicks": sum(1 for v in grid.values() if v == "kick"),
        "snares": sum(1 for v in grid.values() if v == "snare"),
    }
