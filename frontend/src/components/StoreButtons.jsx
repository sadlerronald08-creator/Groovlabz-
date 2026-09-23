import { useStoreLinks, resolveStore } from "../lib/storeLinks";

export default function StoreButtons({ app, size = "lg" }) {
  const { links } = useStoreLinks();
  const store = resolveStore(app, links);
  const h = size === "lg" ? "h-14 sm:h-16" : "h-12";
  return (
    <div className="flex flex-wrap items-center gap-4" data-testid="store-buttons">
      <a
        href={store.ios}
        target="_blank"
        rel="noreferrer"
        className="store-badge inline-block"
        aria-label={`Download ${app.name} on the App Store`}
        data-testid="store-app-store-btn"
        data-live={store.live.ios}
      >
        <img src="/badges/app-store.svg" alt="Download on the App Store" className={`${h} w-auto`} />
      </a>
      <a
        href={store.android}
        target="_blank"
        rel="noreferrer"
        className="store-badge inline-block"
        aria-label={`Get ${app.name} on Google Play`}
        data-testid="store-google-play-btn"
        data-live={store.live.android}
      >
        <img src="/badges/google-play.png" alt="Get it on Google Play" className={`${size === "lg" ? "h-[82px] sm:h-[94px]" : "h-[70px]"} w-auto -my-2 -mx-2`} />
      </a>
    </div>
  );
}
