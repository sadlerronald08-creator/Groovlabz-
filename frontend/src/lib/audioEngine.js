// Web Audio engine — sampled instruments (real recordings) with a synth fallback while samples load.
import { playSampled, preloadInstrument, isInstrumentReady, playSampledDrum } from "./sampler";

let audioCtx = null;
let masterGain = null;

export function warmInstrument(instrument) {
  return preloadInstrument(ensureCtx(), instrument);
}
export { isInstrumentReady };

function ensureCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function setMasterVolume(v) {
  ensureCtx();
  if (masterGain) masterGain.gain.value = v;
}

const NOTE_FREQ = {
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63,
  F4: 349.23, "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0,
  "A#4": 466.16, B4: 493.88, C5: 523.25, "C#5": 554.37, D5: 587.33,
  "D#5": 622.25, E5: 659.25, F5: 698.46, "F#5": 739.99, G5: 783.99,
  "G#5": 830.61, A5: 880.0, "A#5": 932.33, B5: 987.77, C6: 1046.5,
};

export function noteFreq(note) {
  return NOTE_FREQ[note] || 440;
}

/**
 * Play a note with an instrument profile.
 * @param {number|string} noteOrFreq
 * @param {"piano"|"guitar"|"bass"|"violin"} instrument
 * @param {number} duration seconds
 */
export function playNote(noteOrFreq, instrument = "piano", duration = 0.9) {
  const ctx = ensureCtx();
  if (typeof noteOrFreq === "string" && playSampled(ctx, masterGain, noteOrFreq, instrument, duration)) return;
  const freq =
    typeof noteOrFreq === "string" ? noteFreq(noteOrFreq) : noteOrFreq;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";

  switch (instrument) {
    case "guitar": {
      // Karplus-Strong-ish: sawtooth + fast decay + resonant filter
      osc.type = "sawtooth";
      filter.frequency.value = 1800;
      filter.Q.value = 4;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      break;
    }
    case "bass": {
      osc.type = "triangle";
      osc.frequency.value = freq / 2; // one octave down
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.55, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.2);
      break;
    }
    case "violin": {
      osc.type = "sawtooth";
      filter.frequency.value = 2400;
      filter.Q.value = 2;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.15); // slow bow
      gain.gain.setValueAtTime(0.35, now + duration - 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      // vibrato
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);
      break;
    }
    case "piano":
    default: {
      osc.type = "triangle";
      filter.frequency.value = 3000;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      break;
    }
  }

  osc.frequency.setValueAtTime(instrument === "bass" ? freq / 2 : freq, now);
  osc.connect(filter).connect(gain).connect(masterGain);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

/** Drum synthesis: kick/snare/hihat/tom/crash/clap */
export function playDrum(kind = "kick") {
  const ctx = ensureCtx();
  if (playSampledDrum(ctx, masterGain, kind)) return;
  const now = ctx.currentTime;

  const gain = ctx.createGain();
  gain.connect(masterGain);

  if (kind === "kick") {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.001, now + 0.4);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.45);
  } else if (kind === "snare") {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const nf = ctx.createBiquadFilter();
    nf.type = "highpass";
    nf.frequency.value = 1000;
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noise.connect(nf).connect(gain);
    noise.start(now);
    noise.stop(now + 0.2);
  } else if (kind === "hihat") {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(hp).connect(gain);
    noise.start(now);
    noise.stop(now + 0.08);
  } else if (kind === "tom") {
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (kind === "crash") {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 5000;
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    noise.connect(bp).connect(gain);
    noise.start(now);
    noise.stop(now + 1.2);
  } else if (kind === "clap") {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500;
    bp.Q.value = 0.9;
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(bp).connect(gain);
    noise.start(now);
    noise.stop(now + 0.25);
  }
}
