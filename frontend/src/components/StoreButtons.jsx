import { Apple, Play } from "lucide-react";

export default function StoreButtons({ app, size = "lg" }) {
  const big = size === "lg";
  const base = `flex items-center gap-4 rounded-2xl metal-border hover:border-cyan-400/70 transition-all group hover:-translate-y-0.5 ${big ? "p-5" : "p-3"}`;
  return (
    <div className="grid sm:grid-cols-2 gap-4" data-testid="store-buttons">
      <a href={app.store.ios} target="_blank" rel="noreferrer" className={base} data-testid="store-app-store-btn">
        <div className={`${big ? "w-14 h-14" : "w-10 h-10"} rounded-xl bg-gradient-to-br from-slate-100 to-slate-400 flex items-center justify-center shrink-0`}>
          <Apple className={`${big ? "w-7 h-7" : "w-5 h-5"} text-slate-950`} />
        </div>
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-slate-400">Download on the</p>
          <p className={`display font-extrabold text-slate-100 group-hover:text-cyan-300 ${big ? "text-xl" : "text-base"}`}>App Store</p>
        </div>
      </a>
      <a href={app.store.android} target="_blank" rel="noreferrer" className={base} data-testid="store-google-play-btn">
        <div className={`${big ? "w-14 h-14" : "w-10 h-10"} rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0`}>
          <Play className={`${big ? "w-7 h-7" : "w-5 h-5"} text-slate-950`} fill="currentColor" />
        </div>
        <div>
          <p className="mono text-[10px] uppercase tracking-widest text-slate-400">Get it on</p>
          <p className={`display font-extrabold text-slate-100 group-hover:text-cyan-300 ${big ? "text-xl" : "text-base"}`}>Google Play</p>
        </div>
      </a>
    </div>
  );
}
