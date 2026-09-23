import { useCallback, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({ images, index, onClose, onChange }) {
  const touchX = useRef(null);
  const count = images.length;
  const go = useCallback((d) => onChange((index + d + count) % count), [index, count, onChange]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [go, onClose]);

  const img = images[index];
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
      data-testid="lightbox"
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full metal-border flex items-center justify-center" aria-label="Close" data-testid="lightbox-close">
        <X className="w-5 h-5 text-slate-300" />
      </button>
      {count > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-3 sm:left-8 w-11 h-11 rounded-full metal-border flex items-center justify-center hover:border-cyan-400/60" aria-label="Previous" data-testid="lightbox-prev">
            <ChevronLeft className="w-5 h-5 text-cyan-300" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-3 sm:right-8 w-11 h-11 rounded-full metal-border flex items-center justify-center hover:border-cyan-400/60" aria-label="Next" data-testid="lightbox-next">
            <ChevronRight className="w-5 h-5 text-cyan-300" />
          </button>
        </>
      )}
      <img
        key={img.src}
        src={img.src}
        alt={img.label || ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl border border-cyan-400/30 fade-up"
        style={{ boxShadow: "0 0 60px rgba(45,164,255,.35)" }}
        data-testid="lightbox-image"
      />
      <div className="mt-4 flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {img.label && <p className="mono text-[11px] uppercase tracking-widest text-cyan-300" data-testid="lightbox-caption">{img.label}</p>}
        {count > 1 && <p className="mono text-[11px] text-slate-500" data-testid="lightbox-counter">{index + 1} / {count}</p>}
      </div>
    </div>
  );
}
