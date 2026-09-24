import { useEffect, useRef, useState } from "react";
import { useMediaOverrides } from "../lib/media";

export default function AppScreen({ app, className = "" }) {
  const ref = useRef(null);
  const [W, H] = app.frame;
  const [scale, setScale] = useState(0);
  const overrides = useMediaOverrides();
  const src = overrides[`app:${app.id}`] || app.artwork;

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [W]);

  return (
    <div ref={ref} className={`w-full ${className}`} style={{ height: H * scale }} data-testid={`app-screen-${app.id}`}>
      <div className="jn-phone" style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <img src={src} alt={`${app.name} interface`} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    </div>
  );
}
