import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AppScreen from "./AppScreen";

export default function AppCard({ app, index = 0 }) {
  return (
    <Link
      to={`/apps/${app.id}`}
      className="jn-card group block text-left fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
      data-testid={`app-card-${app.id}`}
    >
      <div className="relative px-3 pt-3">
        <div className="absolute inset-x-6 bottom-0 h-24 blur-3xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: app.screen.accent }} />
        <AppScreen app={app} fluid className="relative transition-transform duration-500 group-hover:-translate-y-2" />
      </div>
      <div className="mt-5 px-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="display text-lg font-extrabold">{app.name}</h3>
          <span className="mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
            {app.badge}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-3">{app.tagline}</p>
        <div className="flex items-center gap-2 text-cyan-300 mono text-[10px] uppercase tracking-widest">
          Get the app
          <ArrowRight className="w-3 h-3 ml-auto group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
