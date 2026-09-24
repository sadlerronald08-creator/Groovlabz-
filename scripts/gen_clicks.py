"""Physically-modelled percussion clicks for the GroovSesh metronome (no synth beeps)."""
import numpy as np
import wave
import os

SR = 48000
OUT = "/app/mobile/groovsesh/frontend/assets/audio"


def modes(freqs, decays, amps, dur):
    t = np.arange(int(SR * dur)) / SR
    out = np.zeros_like(t)
    for f, d, a in zip(freqs, decays, amps):
        out += a * np.sin(2 * np.pi * f * t + np.random.uniform(0, 0.3)) * np.exp(-t / d)
    return out


def noise_burst(dur, lowpass_hz, decay):
    n = int(SR * dur)
    white = np.random.randn(n)
    kernel = int(SR / lowpass_hz)
    smooth = np.convolve(white, np.ones(kernel) / kernel, mode="same")
    t = np.arange(n) / SR
    return smooth * np.exp(-t / decay)


def woodblock(pitch=1.0, dur=0.18):
    body = modes([880 * pitch, 1320 * pitch, 2210 * pitch, 3150 * pitch], [0.045, 0.03, 0.02, 0.012], [1.0, 0.55, 0.3, 0.15], dur)
    strike = noise_burst(dur, 6000, 0.004) * 0.9
    sig = body + strike
    sig[: int(SR * 0.0008)] *= np.linspace(0, 1, int(SR * 0.0008))
    return sig


def rimshot(dur=0.22):
    shell = modes([330, 520, 790, 1180], [0.09, 0.06, 0.04, 0.025], [1.0, 0.6, 0.4, 0.2], dur)
    stick = noise_burst(dur, 9000, 0.006) * 1.2
    snap = modes([2400, 3600], [0.01, 0.007], [0.5, 0.3], dur)
    sig = shell + stick + snap
    sig[: int(SR * 0.0008)] *= np.linspace(0, 1, int(SR * 0.0008))
    return sig


def write(name, sig):
    sig = sig / np.max(np.abs(sig)) * 0.92
    pcm = (sig * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", name, f"{len(sig) / SR * 1000:.0f} ms")


np.random.seed(7)
write("click.wav", woodblock(pitch=1.0))
write("click-accent.wav", rimshot())
write("punch-in.wav", woodblock(pitch=0.72, dur=0.22))
