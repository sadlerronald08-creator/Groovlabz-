import { useEffect, useRef, useState } from "react";
import { Menu, Settings, Zap, Play, ChevronRight } from "lucide-react";
import ScreenHero from "./ScreenHero";

export const SCREEN_W = 330;
export const SCREEN_H = 520;

export default function AppScreen({ app, scale = 1, fluid = false, className = "" }) {
  const ref = useRef(null);
  const [fluidScale, setFluidScale] = useState(null);

  useEffect(() => {
    if (!fluid || !ref.current) return;
    const ro = new ResizeObserver(([e]) => setFluidScale(e.contentRect.width / SCREEN_W));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [fluid]);

  const s = fluid ? fluidScale ?? 0 : scale;

  return (
    <div
      ref={ref}
      className={`${fluid ? "w-full" : ""} ${className}`}
      style={{ width: fluid ? undefined : SCREEN_W * s, height: SCREEN_H * s }}
      data-testid={`app-screen-${app.id}`}
    >
      <div
        className="jn-phone"
        style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${s})`, transformOrigin: "top left" }}
      >
        {app.artwork ? (
          <img src={app.artwork} alt={`${app.name} interface`} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <ProceduralScreen app={app} />
        )}
      </div>
    </div>
  );
}

function ProceduralScreen({ app }) {
  const { accent, tagline, badge, nodes, tabs, hero } = app.screen;
  return (
    <div className="absolute inset-0 flex flex-col jn-galaxy" style={{ "--jn-galaxy-img": "url(/jamnow/galaxy-bg.jpg)" }}>
      <div className="relative flex-1 flex flex-col px-3 pt-2 min-h-0">
        <div className="flex items-start justify-between">
          <Menu className="w-4 h-4 text-white/80 mt-1" />
          <div className="text-center">
            <p className="jn-label text-[7px] text-[#A7DFFF]">GROOVLABZ PRESENTS</p>
            <p className="jn-wordmark text-[24px]">{app.name.toUpperCase()}</p>
            <p className="text-[13px] leading-none text-[#C978FF]" style={{ textShadow: "0 0 8px #C978FF" }}>∞</p>
            <p className="jn-label text-[7px] text-[#66CAFF] mt-1">{tagline}</p>
          </div>
          <Settings className="w-4 h-4 mt-1" style={{ color: accent }} />
        </div>

        <div
          className="absolute right-3 top-[70px] px-2 py-1.5 rounded-lg border text-center"
          style={{ borderColor: accent, boxShadow: `0 0 12px ${accent}66`, background: "rgba(2,8,16,.6)" }}
        >
          <Zap className="w-3 h-3 mx-auto mb-0.5" style={{ color: accent }} fill={accent} />
          <p className="jn-display text-[9px] font-bold text-white leading-none">{badge[0]}</p>
          <p className="jn-label text-[5px] text-[#A7DFFF] mt-0.5">{badge[1]}</p>
        </div>

        <div className="flex-1 flex items-center gap-2 mt-6 min-h-0">
          <div className="w-[108px] h-[300px] flex items-center justify-center shrink-0">
            <ScreenHero kind={hero} accent={accent} />
          </div>
          <div className="flex-1 space-y-[6px]">
            {nodes.map(([label, sub], i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="w-[26px] h-[26px] rounded-full border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: accent,
                    background: i === 0 ? accent : "rgba(6,24,42,.92)",
                    boxShadow: `0 0 ${i === 0 ? 14 : 8}px ${accent}`,
                  }}
                >
                  <Play className="w-2.5 h-2.5" style={{ color: i === 0 ? "#02050B" : accent }} fill="currentColor" />
                </span>
                <div className="min-w-0">
                  <p className={`jn-display font-bold text-white leading-tight ${i === 0 ? "text-[12px]" : "text-[11px]"}`}>{label}</p>
                  <p className="jn-label text-[6px] text-[#8FBBD3] leading-tight">{sub}</p>
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-[#7FA9BF] ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex justify-around items-center py-2 border-t border-[#0E2438]" style={{ background: "rgba(2,8,16,.85)" }}>
        {tabs.map(([label, Icon], i) => (
          <div key={label} className="flex flex-col items-center gap-[2px]">
            <Icon className="w-3.5 h-3.5" style={{ color: i === 0 ? accent : "#7FA9BF" }} />
            <span className="jn-label text-[5.5px]" style={{ color: i === 0 ? accent : "#7FA9BF" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
