import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Zap } from "lucide-react";
import { APPS, getApp } from "../data/apps";
import AppScreen from "../components/AppScreen";
import StoreButtons from "../components/StoreButtons";
import AppCard from "../components/AppCard";
import Lightbox from "../components/Lightbox";

export default function AppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const app = getApp(id);
  const [lb, setLb] = useState(null);

  useEffect(() => {
    if (!app) navigate("/apps", { replace: true });
    window.scrollTo(0, 0);
    setLb(null);
  }, [app, navigate, id]);

  if (!app) return null;
  const Icon = app.icon;
  const others = APPS.filter((a) => a.id !== app.id);
  const screens = [
    ...(app.gallery || [{ src: app.artwork, label: `${app.name} home` }]),
    ...(app.landscape ? [app.landscape] : []),
  ];

  return (
    <div className="pt-24 pb-20" data-testid="app-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/apps" className="mono-label inline-flex items-center gap-2 hover:text-cyan-200 mb-10" data-testid="app-detail-back-link">
          <ArrowLeft className="w-3 h-3" /> All apps
        </Link>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 fade-up">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-slate-950" />
              </div>
              <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                {app.badge}
              </span>
            </div>
            <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] mb-4" data-testid="app-detail-name">
              {app.name}
            </h1>
            <p className="text-cyan-300 mono text-sm uppercase tracking-widest mb-2">{app.tagline}</p>
            <p className="jn-label text-xs text-[#66CAFF] mb-6" data-testid="app-detail-motto">{app.motto}</p>
            <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-2xl">{app.description}</p>

            <section className="metal-border rounded-2xl p-6 sm:p-8 mb-10 glow-blue" data-testid="app-detail-store-section">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-300" />
                <p className="mono-label">Get {app.name}</p>
              </div>
              <h2 className="display text-xl sm:text-2xl font-extrabold mb-6">Choose your store to download</h2>
              <StoreButtons app={app} />
              <p className="text-[11px] text-slate-500 mono mt-5">Free download · In‑app upgrades available · One GroovLabz account across all apps</p>
            </section>

            <ul className="grid sm:grid-cols-2 gap-3">
              {app.features.map((f) => (
                <li key={f} className="flex items-start gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/30">
                  <span className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-cyan-300" />
                  </span>
                  <span className="text-slate-200 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 fade-up">
            <button onClick={() => setLb(0)} className="jn-card relative max-w-[360px] mx-auto block w-full text-left cursor-zoom-in" data-testid="app-detail-screen-open" aria-label="Open screen full size">
              <div className="absolute -inset-8 blur-3xl opacity-40" style={{ background: `radial-gradient(circle, ${app.accent}, transparent 70%)` }} />
              <AppScreen app={app} className="relative" />
              <span className="absolute bottom-3 right-3 glass rounded-full px-3 py-1 mono text-[10px] uppercase tracking-widest text-cyan-200">Tap to enlarge</span>
            </button>
            {screens.length > 1 && (
              <div className="mt-8">
                <p className="mono-label mb-3 text-center">Approved interface screens</p>
                <div className="flex justify-center gap-3" data-testid="app-detail-gallery">
                  {screens.map((g, i) => (
                    <button key={g.src} onClick={() => setLb(i)} className="w-[100px] text-left group" data-testid={`app-detail-gallery-${i}`}>
                      <div className={`rounded-xl overflow-hidden border border-cyan-400/30 group-hover:border-cyan-400 transition-colors ${g === app.landscape ? "aspect-[3/2]" : "aspect-[0.6]"}`}>
                        <img src={g.src} alt={g.label} className="w-full h-full object-cover" />
                      </div>
                      <p className="mono text-[9px] text-slate-400 text-center mt-2 uppercase tracking-wider">{g.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {app.landscape && (
          <div className="mt-20" data-testid="app-detail-landscape">
            <p className="mono-label mb-3">Full studio view</p>
            <h2 className="display text-2xl sm:text-3xl font-black mb-8">{app.landscape.label}</h2>
            <button onClick={() => setLb(screens.length - 1)} className="relative block w-full cursor-zoom-in" data-testid="app-detail-landscape-open">
              <div className="absolute -inset-6 blur-3xl opacity-30" style={{ background: app.accent }} />
              <div className="jn-phone relative aspect-[3/2] rounded-[20px]">
                <img src={app.landscape.src} alt={app.landscape.label} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </button>
          </div>
        )}

        <div className="mt-28">
          <p className="mono-label mb-3">More from the ecosystem</p>
          <h2 className="display text-2xl sm:text-3xl font-black mb-10">Every app talks to every other app.</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6" data-testid="app-detail-more-apps">
            {others.map((a, i) => (
              <AppCard key={a.id} app={a} index={i} />
            ))}
          </div>
        </div>
      </div>
      {lb !== null && <Lightbox images={screens} index={lb} onClose={() => setLb(null)} onChange={setLb} />}
    </div>
  );
}
