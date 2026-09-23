const KNOBS = ["GAIN", "TONE", "DRIVE", "LEVEL", "MIX", "VERB"];
const STEMS = [["VOX", "#C978FF"], ["GTR", "#54BAFF"], ["DRM", "#66CAFF"], ["BASS", "#2DA4FF"], ["KEYS", "#79FF45"]];
const CHORD_DOTS = [[1, 4], [2, 2], [3, 1]];

export default function ScreenHero({ kind, accent }) {
  if (kind === "guitar") return <img src="/jamnow/flying-v.png" alt="" className="h-full w-auto object-contain" style={{ filter: `drop-shadow(0 0 14px ${accent}88)` }} />;
  if (kind === "knobs") return <Knobs accent={accent} />;
  if (kind === "stems") return <Stems accent={accent} />;
  if (kind === "disc") return <Disc accent={accent} />;
  return <Chord accent={accent} />;
}

const panel = (accent) => ({
  background: "linear-gradient(180deg, rgba(12,44,70,.85), rgba(2,8,16,.95))",
  border: `1px solid ${accent}66`,
  boxShadow: `0 0 18px ${accent}44, inset 0 1px 0 rgba(255,255,255,.08)`,
});

function Knobs({ accent }) {
  return (
    <div className="w-[96px] rounded-xl p-2 grid grid-cols-2 gap-2" style={panel(accent)}>
      {KNOBS.map((k, i) => (
        <div key={k} className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-full relative"
            style={{
              background: "conic-gradient(from 200deg, #cbd5e1, #475569, #e2e8f0, #334155, #cbd5e1)",
              boxShadow: `0 2px 6px #000, 0 0 8px ${accent}55`,
              transform: `rotate(${-120 + i * 45}deg)`,
            }}
          >
            <span className="absolute left-1/2 top-1 w-[2px] h-3 -ml-[1px] rounded" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
          </div>
          <span className="jn-label text-[5px]" style={{ color: accent }}>{k}</span>
        </div>
      ))}
      <div className="col-span-2 h-6 rounded-md mt-1 flex items-center justify-center" style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}>
        <span className="jn-display text-[8px] font-bold text-[#02050B] tracking-widest">STOMP</span>
      </div>
    </div>
  );
}

function Stems({ accent }) {
  return (
    <div className="w-[100px] rounded-xl p-2 space-y-[7px]" style={panel(accent)}>
      {STEMS.map(([name, color], r) => (
        <div key={name}>
          <p className="jn-label text-[5px] mb-[2px]" style={{ color }}>{name}</p>
          <div className="h-5 flex items-center gap-[1.5px]">
            {Array.from({ length: 22 }).map((_, j) => (
              <span
                key={j}
                className="flex-1 rounded-[1px]"
                style={{ height: `${25 + Math.abs(Math.sin(j * 0.9 + r * 1.7)) * 75}%`, background: color, opacity: j < 15 ? 0.9 : 0.35, boxShadow: j < 15 ? `0 0 4px ${color}` : "none" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Disc({ accent }) {
  return (
    <div className="relative w-[100px] h-[100px]">
      <div
        className="absolute inset-0 rounded-full jn-spin"
        style={{
          background: "repeating-radial-gradient(circle, #0b1220 0 2px, #1e293b 2px 3px)",
          boxShadow: `0 0 24px ${accent}88, inset 0 0 20px #000`,
          border: `2px solid ${accent}`,
        }}
      >
        <div className="absolute inset-[34%] rounded-full flex items-center justify-center" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }}>
          <span className="w-2 h-2 rounded-full bg-[#02050B]" />
        </div>
      </div>
      <div className="absolute -right-2 top-2 w-1 h-14 rounded origin-top rotate-[25deg]" style={{ background: "linear-gradient(#e2e8f0,#64748b)", boxShadow: "0 0 6px #000" }} />
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <p className="jn-display text-[10px] font-bold" style={{ color: accent }}>124 BPM · Am</p>
        <div className="h-1 rounded-full bg-[#0E2438] mt-1 overflow-hidden">
          <div className="h-full w-2/3 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        </div>
      </div>
    </div>
  );
}

function Chord({ accent }) {
  return (
    <div className="w-[96px] rounded-xl p-2" style={panel(accent)}>
      <p className="jn-wordmark text-[22px] text-center mb-1">G</p>
      <div className="relative mx-auto w-[64px] h-[84px]">
        <div className="absolute top-0 left-0 right-0 h-[3px] rounded" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 h-px bg-slate-400/60" style={{ top: `${(i + 1) * 20}%` }} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-300/70" style={{ left: `${i * 20}%` }} />
        ))}
        {CHORD_DOTS.map(([fret, str]) => (
          <span
            key={`${fret}-${str}`}
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full"
            style={{ left: `${str * 20}%`, top: `${fret * 20 - 10}%`, background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
        ))}
      </div>
      <div className="flex justify-center gap-1 mt-2">
        {["C", "D", "Em"].map((c) => (
          <span key={c} className="jn-display text-[7px] font-bold px-1.5 py-0.5 rounded border" style={{ color: accent, borderColor: `${accent}66` }}>{c}</span>
        ))}
      </div>
    </div>
  );
}
