import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { APPS } from "../data/apps";
import AppScreen from "../components/AppScreen";
import AppCard from "../components/AppCard";

export default function Home() {
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
              GroovLabz is one connected music‑creation environment — capture
              ideas, shape your tone, strip stems, practice with tracks and read
              charts. Five apps, one account, one electric‑blue signal chain.
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
            <Link to="/apps/groovsesh" className="jn-card group block relative max-w-[340px] mx-auto" data-testid="hero-groovsesh-screen-link">
              <div className="absolute -inset-8 bg-gradient-to-br from-[#2DA4FF]/30 via-blue-600/10 to-[#C978FF]/20 blur-3xl" />
              <AppScreen app={APPS[0]} fluid className="relative" />
              <p className="relative mt-4 text-center mono text-[10px] uppercase tracking-widest text-cyan-300">
                GroovSesh · Flying‑V home interface
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== APP INTERFACE CARDS ========== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" data-testid="home-apps-section">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
          <div>
            <p className="mono-label mb-3">The Ecosystem</p>
            <h2 className="display text-3xl sm:text-4xl lg:text-5xl font-black">
              Five apps, engineered to feel like one studio.
            </h2>
            <p className="text-slate-400 mt-3 max-w-xl">
              Tap any interface to open its page and grab it on the App Store or Google Play.
            </p>
          </div>
          <Link
            to="/apps"
            className="mono-label text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-2"
            data-testid="see-all-apps-link"
          >
            See all apps <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-6">
          {APPS.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
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
    </div>
  );
}
