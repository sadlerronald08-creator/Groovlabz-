import { X, Smartphone, Apple } from "lucide-react";

export default function DownloadModal({ open, onClose, app }) {
  if (!open || !app) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="download-modal-backdrop"
    >
      <div
        className="relative max-w-md w-full glass rounded-2xl border border-cyan-500/30 p-8"
        onClick={(e) => e.stopPropagation()}
        data-testid="download-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-md metal-border flex items-center justify-center"
          data-testid="download-modal-close"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <p className="mono-label mb-2">Download {app.name}</p>
        <h3 className="display text-2xl font-black mb-1">Choose your store</h3>
        <p className="text-sm text-slate-400 mb-6">{app.tagline}</p>

        <div className="grid grid-cols-1 gap-3">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl metal-border hover:border-cyan-400/60 transition-all group"
            data-testid="download-modal-google-play-button"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mono uppercase">Get it on</p>
              <p className="font-bold text-slate-100 group-hover:text-cyan-300">
                Google Play
              </p>
            </div>
          </a>

          <a
            href="https://www.apple.com/app-store/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl metal-border hover:border-cyan-400/60 transition-all group"
            data-testid="download-modal-app-store-button"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-400 flex items-center justify-center">
              <Apple className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mono uppercase">Download on the</p>
              <p className="font-bold text-slate-100 group-hover:text-cyan-300">
                App Store
              </p>
            </div>
          </a>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-6 mono">
          Free download · In-app upgrades available
        </p>
      </div>
    </div>
  );
}
