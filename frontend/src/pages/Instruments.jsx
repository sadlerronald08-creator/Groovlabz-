import { useEffect, useState, useCallback } from "react";
import { Volume2, Piano as PianoIcon, Guitar, Drum, Music4 } from "lucide-react";
import { playNote, playDrum, setMasterVolume } from "../lib/audioEngine";

const PIANO_KEYS = [
  { note: "C4", type: "white", key: "a" },
  { note: "C#4", type: "black", key: "w" },
  { note: "D4", type: "white", key: "s" },
  { note: "D#4", type: "black", key: "e" },
  { note: "E4", type: "white", key: "d" },
  { note: "F4", type: "white", key: "f" },
  { note: "F#4", type: "black", key: "t" },
  { note: "G4", type: "white", key: "g" },
  { note: "G#4", type: "black", key: "y" },
  { note: "A4", type: "white", key: "h" },
  { note: "A#4", type: "black", key: "u" },
  { note: "B4", type: "white", key: "j" },
  { note: "C5", type: "white", key: "k" },
  { note: "C#5", type: "black", key: "o" },
  { note: "D5", type: "white", key: "l" },
  { note: "D#5", type: "black", key: "p" },
  { note: "E5", type: "white", key: ";" },
];

const GUITAR_STRINGS = [
  { note: "E5", label: "e" },
  { note: "B4", label: "B" },
  { note: "G4", label: "G" },
  { note: "D4", label: "D" },
  { note: "A4", label: "A" },
  { note: "E4", label: "E" },
];

const DRUMS = [
  { id: "kick", label: "KICK", key: "1" },
  { id: "snare", label: "SNARE", key: "2" },
  { id: "hihat", label: "HAT", key: "3" },
  { id: "tom", label: "TOM", key: "4" },
  { id: "clap", label: "CLAP", key: "5" },
  { id: "crash", label: "CRASH", key: "6" },
];

const VIOLIN_NOTES = ["G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"];
const BASS_NOTES = ["E4", "A4", "D4", "G4", "C4", "F4"];

const INSTRUMENTS = [
  { id: "piano", name: "Grand Piano", icon: PianoIcon },
  { id: "guitar", name: "Guitar", icon: Guitar },
  { id: "bass", name: "Slap Bass", icon: Music4 },
  { id: "violin", name: "Violin", icon: Music4 },
  { id: "drums", name: "Drum Pad", icon: Drum },
];

export default function Instruments() {
  const [active, setActive] = useState("piano");
  const [volume, setVolume] = useState(0.7);
  const [pressed, setPressed] = useState({});
  const [hits, setHits] = useState({});
  const [plucked, setPlucked] = useState({});

  useEffect(() => setMasterVolume(volume), [volume]);

  const flashKey = useCallback((note) => {
    setPressed((p) => ({ ...p, [note]: true }));
    setTimeout(() => setPressed((p) => ({ ...p, [note]: false })), 200);
  }, []);

  const handleKey = useCallback(
    (e) => {
      const k = e.key.toLowerCase();
      if (active === "piano") {
        const found = PIANO_KEYS.find((x) => x.key === k);
        if (found) {
          playNote(found.note, "piano", 1.2);
          flashKey(found.note);
        }
      } else if (active === "drums") {
        const found = DRUMS.find((x) => x.key === k);
        if (found) {
          playDrum(found.id);
          setHits((h) => ({ ...h, [found.id]: true }));
          setTimeout(() => setHits((h) => ({ ...h, [found.id]: false })), 150);
        }
      }
    },
    [active, flashKey]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="pt-24 pb-16" data-testid="instruments-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mono-label mb-3">Playground</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Play <span className="text-cyan-300">real instruments</span> in your browser.
          </h1>
          <p className="text-slate-300 text-lg">
            No downloads, no plugins. Every note is synthesized live in your
            browser using the Web Audio API — plug in headphones for the full
            studio feel.
          </p>
        </div>

        {/* Instrument selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" role="tablist">
          {INSTRUMENTS.map((i) => {
            const Icon = i.icon;
            const isActive = active === i.id;
            return (
              <button
                key={i.id}
                onClick={() => setActive(i.id)}
                className={`inline-flex items-center gap-2 h-11 px-4 rounded-full whitespace-nowrap font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-cyan-400 text-slate-950 glow-cyan"
                    : "metal-border text-slate-300 hover:border-cyan-400/40"
                }`}
                data-testid={`instrument-tab-${i.id}`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="w-4 h-4" />
                {i.name}
              </button>
            );
          })}
        </div>

        {/* Volume */}
        <div className="metal-border rounded-2xl p-6 mb-6 flex items-center gap-4">
          <Volume2 className="w-5 h-5 text-cyan-300" />
          <span className="mono-label">Master</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400"
            data-testid="volume-slider"
            aria-label="Master volume"
          />
          <span className="mono text-xs text-cyan-300 w-10 text-right">
            {Math.round(volume * 100)}
          </span>
        </div>

        {/* Instrument area */}
        <div className="metal-border rounded-2xl p-6 sm:p-8 min-h-[380px]">
          {active === "piano" && (
            <div className="relative h-64 sm:h-72 flex items-end select-none">
              {PIANO_KEYS.filter((k) => k.type === "white").map((k, idx, arr) => {
                const w = 100 / arr.length;
                return (
                  <button
                    key={k.note}
                    onMouseDown={() => {
                      playNote(k.note, "piano", 1.2);
                      flashKey(k.note);
                    }}
                    className={`piano-key-white flex-1 h-full rounded-b-md flex items-end justify-center pb-3 text-xs font-bold ${
                      pressed[k.note] ? "active" : ""
                    }`}
                    style={{ marginRight: idx === arr.length - 1 ? 0 : 1 }}
                    data-testid={`piano-key-${k.note}`}
                    aria-label={`Piano key ${k.note}`}
                  >
                    <span className="pointer-events-none opacity-70">{k.key}</span>
                  </button>
                );
              })}
              {/* Overlay black keys */}
              <div className="absolute inset-0 flex pointer-events-none">
                {PIANO_KEYS.filter((k) => k.type === "white").map((wk, idx) => {
                  const bk = PIANO_KEYS.find(
                    (k) =>
                      k.type === "black" &&
                      PIANO_KEYS.indexOf(k) === PIANO_KEYS.indexOf(wk) + 1
                  );
                  return (
                    <div key={idx} className="flex-1 relative">
                      {bk && (
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            playNote(bk.note, "piano", 1.2);
                            flashKey(bk.note);
                          }}
                          className={`piano-key-black pointer-events-auto absolute right-[-14%] top-0 w-[28%] h-[62%] rounded-b-md z-10 ${
                            pressed[bk.note] ? "active" : ""
                          }`}
                          data-testid={`piano-key-${bk.note}`}
                          aria-label={`Piano key ${bk.note}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active === "guitar" && (
            <div className="space-y-4">
              <p className="mono-label">Strum a string — 6 open notes</p>
              <div className="relative bg-gradient-to-b from-amber-950/60 to-slate-950 rounded-xl p-8">
                {GUITAR_STRINGS.map((s, i) => (
                  <div
                    key={s.note}
                    className="flex items-center gap-4 py-3"
                    data-testid={`guitar-string-${s.label}`}
                  >
                    <span className="mono text-xs text-cyan-300 w-6">{s.label}</span>
                    <button
                      onClick={() => {
                        playNote(s.note, "guitar", 1.5);
                        setPlucked((p) => ({ ...p, [s.note]: true }));
                        setTimeout(
                          () => setPlucked((p) => ({ ...p, [s.note]: false })),
                          400
                        );
                      }}
                      className={`guitar-string flex-1 ${
                        plucked[s.note] ? "plucked" : ""
                      }`}
                      aria-label={`Guitar string ${s.label}`}
                    />
                    <span className="mono text-[10px] text-slate-500 w-8">{s.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "bass" && (
            <div>
              <p className="mono-label mb-4">Slap bass — thick low end</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {BASS_NOTES.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      playNote(n, "bass", 1.4);
                      flashKey(n);
                    }}
                    className={`h-24 rounded-xl metal-border font-bold display text-lg hover:border-cyan-400/60 transition-all ${
                      pressed[n]
                        ? "bg-cyan-400 text-slate-950 glow-cyan"
                        : "text-slate-200"
                    }`}
                    data-testid={`bass-note-${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "violin" && (
            <div>
              <p className="mono-label mb-4">Violin — long sustained bows</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {VIOLIN_NOTES.map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      playNote(n, "violin", 2.5);
                      flashKey(n);
                    }}
                    className={`h-28 rounded-xl metal-border font-bold display text-base hover:border-cyan-400/60 transition-all ${
                      pressed[n]
                        ? "bg-cyan-400 text-slate-950 glow-cyan"
                        : "text-slate-200"
                    }`}
                    data-testid={`violin-note-${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {active === "drums" && (
            <div>
              <p className="mono-label mb-4">MPC Drum Pad — keys 1-6</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DRUMS.map((d) => (
                  <button
                    key={d.id}
                    onMouseDown={() => {
                      playDrum(d.id);
                      setHits((h) => ({ ...h, [d.id]: true }));
                      setTimeout(
                        () => setHits((h) => ({ ...h, [d.id]: false })),
                        150
                      );
                    }}
                    className={`drum-pad h-32 rounded-2xl display font-black text-xl ${
                      hits[d.id] ? "hit" : ""
                    }`}
                    data-testid={`drum-pad-${d.id}`}
                  >
                    <span className="block">{d.label}</span>
                    <span className="mono text-[10px] font-normal opacity-60 mt-1 block">
                      [{d.key}]
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
