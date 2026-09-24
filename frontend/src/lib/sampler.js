// Sampled instruments (real recordings, MIT-licensed tonejs-instruments set) with pitch-shifted nearest-sample playback.
const CDN = "https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples";

const NAMES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];
const toMidi = (name) => {
  const m = /^([A-G])(#|s)?(\d)$/.exec(name);
  if (!m) return 69;
  return (parseInt(m[3], 10) + 1) * 12 + NAMES.indexOf(m[1] + (m[2] ? "s" : ""));
};

export const SAMPLE_SETS = {
  piano: { folder: "piano", notes: ["C3", "Ds3", "Fs3", "A3", "C4", "Ds4", "Fs4", "A4", "C5", "Ds5", "Fs5", "A5", "C6"], release: 0.6, transpose: 0 },
  guitar: { folder: "guitar-acoustic", notes: ["E2", "Fs2", "A2", "C3", "D3", "F3", "G3", "B3", "Cs4", "D4", "E4", "G4", "A4"], release: 0.5, transpose: 0 },
  bass: { folder: "bass-electric", notes: ["E1", "G1", "As1", "Cs2", "E2", "G2", "As2", "Cs3", "E3", "G3"], release: 0.4, transpose: -24 },
  violin: { folder: "violin", notes: ["G3", "A3", "C4", "E4", "G4", "A4", "C5", "E5", "G5", "A5", "C6"], release: 0.9, transpose: 0 },
};

const buffers = new Map();
const pending = new Map();

async function loadBuffer(ctx, folder, note, base = CDN) {
  const key = `${folder}/${note}`;
  if (buffers.has(key)) return buffers.get(key);
  if (pending.has(key)) return pending.get(key);
  const p = fetch(`${base}/${folder}/${note}.mp3`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then((ab) => ctx.decodeAudioData(ab))
    .then((buf) => { buffers.set(key, buf); pending.delete(key); return buf; })
    .catch(() => { pending.delete(key); return null; });
  pending.set(key, p);
  return p;
}

// Real acoustic drum kit (Tone.js audio set, MIT). clap/crash have no recording → synth fallback.
const DRUM_CDN = "https://cdn.jsdelivr.net/gh/Tonejs/audio@master/drum-samples";
const DRUM_FOLDER = "acoustic-kit";
const DRUM_FILES = { kick: "kick", snare: "snare", hihat: "hihat", tom: "tom2" };

export function preloadInstrument(ctx, instrument) {
  if (instrument === "drums") {
    return Promise.all(Object.values(DRUM_FILES).map((f) => loadBuffer(ctx, DRUM_FOLDER, f, DRUM_CDN)));
  }
  const set = SAMPLE_SETS[instrument];
  if (!set) return Promise.resolve();
  return Promise.all(set.notes.map((n) => loadBuffer(ctx, set.folder, n)));
}

export function isInstrumentReady(instrument) {
  if (instrument === "drums") return Object.values(DRUM_FILES).every((f) => buffers.has(`${DRUM_FOLDER}/${f}`));
  const set = SAMPLE_SETS[instrument];
  return !!set && set.notes.every((n) => buffers.has(`${set.folder}/${n}`));
}

export function playSampledDrum(ctx, destination, kind) {
  const file = DRUM_FILES[kind];
  const buf = file && buffers.get(`${DRUM_FOLDER}/${file}`);
  if (!buf) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = kind === "hihat" ? 0.8 : 1.0;
  src.connect(gain).connect(destination);
  src.start();
  return true;
}

// Returns true if a sample was played; false if samples aren't loaded yet (caller falls back to synth).
export function playSampled(ctx, destination, noteName, instrument, duration) {
  const set = SAMPLE_SETS[instrument];
  if (!set) return false;
  const target = toMidi(noteName) + set.transpose;
  let best = null;
  for (const n of set.notes) {
    const d = Math.abs(toMidi(n) - target);
    if (!best || d < best.d) best = { n, d, midi: toMidi(n) };
  }
  const buf = buffers.get(`${set.folder}/${best.n}`);
  if (!buf) {
    preloadInstrument(ctx, instrument);
    return false;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = Math.pow(2, (target - best.midi) / 12);
  const gain = ctx.createGain();
  const now = ctx.currentTime;
  const hold = Math.max(0.15, duration);
  gain.gain.setValueAtTime(1, now);
  gain.gain.setValueAtTime(1, now + hold);
  gain.gain.exponentialRampToValueAtTime(0.001, now + hold + set.release);
  src.connect(gain).connect(destination);
  src.start(now);
  src.stop(now + hold + set.release + 0.05);
  return true;
}
