import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  Play,
  Download,
  Sparkles,
  Zap,
  CircleDot,
} from "lucide-react";
import { APPS } from "../data/apps";
import DownloadModal from "../components/DownloadModal";

export default function Home() {
  const [selectedApp, setSelectedApp] = useState(null);

  return (
    <div data-testid="home-page" className="pt-16">
      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/18197122/pexels-photo-18197122.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Studio background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-slate-950/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 fade-up">
            <div className="inline-flex items-center gap-2 metal-border rounded-full px-3 py-1 mb-6">
              <span className="signal-dot" />
              <span className="mono text-[11px] uppercase tracking-widest text-cyan-300">
                Studio · Ecosystem · Live
              </span>
            </div>
            <h1 className="display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
              Five apps.<br />
              <span className="text-glow-cyan text-cyan-300">One frequency.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl leading-relaxed mb-8">
              GroovLabz is a full music technology ecosystem — record, remix,
              tune, learn, and shred with wireless hardware that syncs like
              magic. Built by producers for producers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/apps"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan transition-all hover:scale-[1.03]"
                data-testid="hero-explore-apps-btn"
              >
                Explore the ecosystem
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/instruments"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full metal-border text-cyan-200 hover:border-cyan-400 transition-all"
                data-testid="hero-play-instruments-btn"
              >
                <Play className="w-4 h-4" />
                Play instruments in browser
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { k: "5", l: "Studio apps" },
                { k: "2M+", l: "Musicians" },
                { k: "<4ms", l: "BT latency" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-cyan-400/60 pl-3">
                  <p className="display text-3xl font-black text-cyan-300">
                    {s.k}
                  </p>
                  <p className="mono text-[11px] uppercase tracking-widest text-slate-400 mt-1">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 fade-up">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent blur-3xl" />
              <div className="relative metal-border rounded-2xl p-1 glow-blue">
                <div className="bg-slate-950 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-3 h-3 text-rose-400" />
                      <span className="mono text-[11px] uppercase text-slate-400">
                        Rec · GroovSesh Preview
                      </span>
                    </div>
                    <span className="mono text-[11px] text-cyan-300">
                      00:03:24
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {[
                      "Vocals — Lead",
                      "Drums — Kit A",
                      "Bass — Slap",
                      "Synth — Pad",
                    ].map((t, i) => (
                      <div
                        key={t}
                        className="flex items-center gap-3 p-3 rounded-md bg-slate-900/60 border border-slate-800"
                      >
                        <span className="mono text-[10px] text-slate-500 w-4">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm text-slate-200 w-32">{t}</span>
                        <div className="flex-1 h-6 flex items-center gap-[2px]">
                          {Array.from({ length: 32 }).map((_, j) => (
                            <span
                              key={j}
                              className="flex-1 rounded-sm"
                              style={{
                                height: `${20 + Math.abs(Math.sin(j * (i + 1))) * 80}%`,
                                background:
                                  j < 24
                                    ? `linear-gradient(180deg, #00F0FF, #0066FF)`
                                    : "#334155",
                                opacity: j < 24 ? 0.85 : 0.4,
                              }}
                            />
                          ))}
                        </div>
                        <span className="mono text-[10px] text-cyan-300">
                          {i === 0 ? "REC" : "PLAY"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== APP DOWNLOAD CARDS ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
          <div>
            <p className="mono-label mb-3">The Ecosystem</p>
            <h2 className="display text-3xl sm:text-4xl lg:text-5xl font-black">
              Five apps, engineered to feel like one studio.
            </h2>
          </div>
          <Link
            to="/apps"
            className="mono-label text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-2"
            data-testid="see-all-apps-link"
          >
            See all apps <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {APPS.map((app, i) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className="text-left group relative overflow-hidden rounded-2xl metal-border p-6 hover:border-cyan-400/60 transition-all hover:-translate-y-1 duration-300"
                data-testid={`app-card-${app.id}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br opacity-20 blur-3xl group-hover:opacity-40 transition-opacity"
                     style={{ background: `linear-gradient(135deg, var(--gl-cyan), var(--gl-blue))` }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-slate-950" />
                    </div>
                    <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      {app.badge}
                    </span>
                  </div>
                  <h3 className="display text-xl font-extrabold mb-1">
                    {app.name}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    {app.tagline}
                  </p>
                  <div className="flex items-center gap-2 text-cyan-300 mono text-xs uppercase tracking-widest">
                    <Download className="w-3.5 h-3.5" />
                    Download
                    <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========== FEATURE STRIP ========== */}
      <section className="relative py-16 border-y border-slate-800/80 bg-slate-950/60">
        <div className="marquee">
          <div className="marquee-track">
            {[
              "ZERO-LATENCY BT 5.3",
              "500,000+ CHORD CHARTS",
              "24 AMP MODELS",
              "STEM SEPARATION",
              "SUB-0.1¢ STROBE TUNING",
              "16 TRACKS · UNLIMITED TAKES",
              "TONE SHARING COMMUNITY",
              "STUDIO MONITORING GEAR",
            ]
              .concat([
                "ZERO-LATENCY BT 5.3",
                "500,000+ CHORD CHARTS",
                "24 AMP MODELS",
                "STEM SEPARATION",
                "SUB-0.1¢ STROBE TUNING",
                "16 TRACKS · UNLIMITED TAKES",
                "TONE SHARING COMMUNITY",
                "STUDIO MONITORING GEAR",
              ])
              .map((t, i) => (
                <span
                  key={i}
                  className="display text-3xl sm:text-5xl font-black text-slate-800"
                >
                  {t}{" "}
                  <Sparkles className="inline w-6 h-6 text-cyan-400 mx-6" />
                </span>
              ))}
          </div>
        </div>
      </section>

      {/* ========== INSTRUMENT + SHOP TEASER ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-8">
        <Link
          to="/instruments"
          className="group relative overflow-hidden rounded-2xl metal-border p-8 min-h-[340px] hover:border-cyan-400/60 transition-all"
          data-testid="teaser-instruments"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/11300427/pexels-photo-11300427.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
              alt="Play instruments"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/70 to-transparent" />
          </div>
          <div className="relative h-full flex flex-col justify-end">
            <p className="mono-label mb-3">Playground</p>
            <h3 className="display text-3xl sm:text-4xl font-black mb-2">
              Play real instruments in your browser
            </h3>
            <p className="text-slate-300 mb-6 max-w-md">
              Piano, guitar, bass, violin, drums — all powered by Web Audio.
              Warm up before you download the apps.
            </p>
            <div className="mono-label text-cyan-300 inline-flex items-center gap-2">
              Open the playground <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>

        <Link
          to="/shop"
          className="group relative overflow-hidden rounded-2xl metal-border p-8 min-h-[340px] hover:border-cyan-400/60 transition-all"
          data-testid="teaser-shop"
        >
          <div className="absolute inset-0">
            <img
              src="https://images.pexels.com/photos/29205062/pexels-photo-29205062.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
              className="w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity"
              alt="Shop hardware"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/70 to-transparent" />
          </div>
          <div className="relative h-full flex flex-col justify-end">
            <p className="mono-label mb-3">Hardware</p>
            <h3 className="display text-3xl sm:text-4xl font-black mb-2">
              Wireless guitar rig. Studio monitoring. Studio life.
            </h3>
            <p className="text-slate-300 mb-6 max-w-md">
              The GroovPuck Bluetooth adapter turns any guitar into a wireless
              stage-ready rig. Ship worldwide.
            </p>
            <div className="mono-label text-cyan-300 inline-flex items-center gap-2">
              Shop the store <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
      </section>

      <DownloadModal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        app={selectedApp}
      />
    </div>
  );
}
