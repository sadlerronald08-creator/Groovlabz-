import { useState } from "react";
import { Check, Download } from "lucide-react";
import { APPS } from "../data/apps";
import DownloadModal from "../components/DownloadModal";

export default function Apps() {
  const [selectedApp, setSelectedApp] = useState(null);

  return (
    <div className="pt-24 pb-16" data-testid="apps-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl">
          <p className="mono-label mb-3">The GroovLabz Apps</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Five companion apps, one <span className="text-cyan-300">creative signal chain.</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Every app talks to every other app. Record in GroovSesh, tune with
            GroovTune, pull a chord chart from GroovChords — no wires, no
            friction, no context switch.
          </p>
        </div>

        <div className="space-y-16">
          {APPS.map((app, idx) => {
            const Icon = app.icon;
            const flipped = idx % 2 === 1;
            return (
              <div
                key={app.id}
                className="grid lg:grid-cols-2 gap-10 items-center"
                data-testid={`app-detail-${app.id}`}
              >
                <div className={flipped ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-slate-950" />
                    </div>
                    <span className="mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      {app.badge}
                    </span>
                  </div>
                  <h2 className="display text-3xl sm:text-4xl font-black mb-3">
                    {app.name}
                  </h2>
                  <p className="text-cyan-300 mono text-sm uppercase tracking-widest mb-4">
                    {app.tagline}
                  </p>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    {app.description}
                  </p>
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
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold glow-cyan transition-all hover:scale-[1.03]"
                    data-testid={`download-${app.id}-btn`}
                  >
                    <Download className="w-4 h-4" />
                    Download {app.name}
                  </button>
                </div>
                <div className={flipped ? "lg:order-1" : ""}>
                  <div className="relative">
                    <div className="absolute -inset-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-2xl" />
                    <div className="relative metal-border rounded-2xl p-1">
                      <img
                        src={app.image}
                        alt={app.name}
                        className="w-full h-[360px] object-cover rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DownloadModal open={!!selectedApp} onClose={() => setSelectedApp(null)} app={selectedApp} />
    </div>
  );
}
