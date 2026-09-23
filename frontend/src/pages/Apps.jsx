import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { APPS } from "../data/apps";
import AppScreen from "../components/AppScreen";
import StoreButtons from "../components/StoreButtons";

export default function Apps() {
  return (
    <div className="pt-24 pb-16" data-testid="apps-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="mono-label mb-3">The GroovLabz Apps</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Five companion apps, one <span className="text-cyan-300">creative signal chain.</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Idea → tone → recording → cleanup → mixing → practice → reference. Capture in GroovSesh,
            shape tone in GroovBox, strip stems in GroovMash, practice with GroovTrackz and read
            charts in GroovCharts — one account, no friction.
          </p>
        </div>

        <div className="space-y-24">
          {APPS.map((app, idx) => {
            const Icon = app.icon;
            const flipped = idx % 2 === 1;
            return (
              <div key={app.id} className="grid lg:grid-cols-2 gap-12 items-center" data-testid={`app-detail-${app.id}`}>
                <div className={flipped ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-slate-950" />
                    </div>
                    <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      {app.badge}
                    </span>
                  </div>
                  <h2 className="display text-3xl sm:text-4xl font-black mb-3">{app.name}</h2>
                  <p className="text-cyan-300 mono text-sm uppercase tracking-widest mb-1">{app.tagline}</p>
                  <p className="jn-label text-[11px] text-[#66CAFF] mb-4">{app.motto}</p>
                  <p className="text-slate-300 leading-relaxed mb-6">{app.description}</p>
                  <ul className="space-y-3 mb-8">
                    {app.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-cyan-300" />
                        </span>
                        <span className="text-slate-200">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <StoreButtons app={app} size="sm" />
                  <Link
                    to={`/apps/${app.id}`}
                    className="mt-5 inline-flex items-center gap-2 mono-label hover:text-cyan-200"
                    data-testid={`download-${app.id}-btn`}
                  >
                    Open {app.name} page <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className={flipped ? "lg:order-1" : ""}>
                  <Link to={`/apps/${app.id}`} className="jn-card group block relative max-w-[330px] mx-auto" data-testid={`app-screen-link-${app.id}`}>
                    <div className="absolute -inset-6 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity" style={{ background: app.accent }} />
                    <AppScreen app={app} className="relative" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
