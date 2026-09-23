# GroovLabz — Product Requirements Doc

## Original Problem Statement
GroovLabz is the main website for a music technology ecosystem with five companion apps
(recording, mashup/editing, tuning, chords/lyrics with chord charts, guitar emulation with
Bluetooth hardware). Responsive, immersive, dark professional recording-studio atmosphere,
cyan/blue neon accents. Home + Apps + Instruments (browser-playable) + Shop (Bluetooth
hardware) + Account + About + Contact + legal pages.

## Architecture
- **Backend**: FastAPI, Motor (async MongoDB), JWT auth (bcrypt + PyJWT), Stripe checkout
  (claimable sandbox), Resend email via Emergent integration proxy, all routes under `/api`.
- **Frontend**: React 19 + React Router 7, Tailwind + custom studio CSS, Web Audio API for
  Instruments playground, sonner toasts, axios with cookie + Bearer token.

## User Personas
- **Producer / Home Studio**: wants to record & mix on mobile
- **Touring Musician**: wants chord charts, tuning, Bluetooth guitar rig on the road
- **Beat Maker / DJ**: wants mashups, stem separation
- **Casual Learner**: warms up on browser instruments before downloading apps

## Core Requirements (static)
1. Home page with hero, 5 app download cards → choice modal (Google Play / App Store)
2. Apps page: detailed feature showcases for all 5 companion apps
3. Interactive Instruments (piano, guitar, bass, violin, drums) — real Web Audio audio
4. Online Shop with Stripe checkout for Bluetooth hardware
5. Account: signup/login, dashboard (orders, activity, connected apps, stats)
6. About + Contact (DB + email) + Privacy + Terms

## Implemented (2026-02)
- Backend: auth register/login/logout/me, shop products, payments checkout + status + webhook,
  contact (DB + Resend email), activity log, account dashboard, orders/mine, admin seeding,
  Mongo indexes.
- Frontend: full 12-route SPA — Home, Apps, Instruments, Shop, About, Contact, Login,
  Register, Account, Privacy, Terms, Payment success/cancel. Cart drawer, download modal,
  glassmorphic navbar, studio-styled footer.
- Integrations: JWT auth, Stripe sandbox (test mode, DIY tax), Resend managed email,
  Emergent LLM key wired for future features.
- Tests: 16/16 pytest backend tests pass; full frontend testing pass 100%.

## Implemented (2026-06) — Jam Now Studio interface import
- Cloned https://github.com/sadlerronald08-creator/Groovlabz- (GroovSesh Expo app). Copied approved
  artwork to `/frontend/public/jamnow/` (groovsesh-home/quickjams/export, flying-v, galaxy-bg).
- Five apps re-aligned to the user's GroovLabz Master Spec: GroovSesh, GroovBox, GroovMash,
  GroovTrackz, GroovCharts (`data/apps.js`, each with `screen` config, `store` links, optional
  `artwork`/`gallery`).
- `AppScreen` phone-mockup component (Jam Now electric-blue galaxy style; GroovSesh uses real
  artwork, others procedural via `ScreenHero`), `AppCard`, `StoreButtons`.
- Home: hero shows GroovSesh artwork; 5 interface cards → `/apps/:id`.
- New `AppDetail` page (`/apps/:id`): App Store / Google Play buttons, features, gallery, more apps.
- Apps page uses mockups + inline store buttons. `DownloadModal` removed.
- Tests: iteration_2 frontend 14/14 pass.
- NOTE: store URLs are generic placeholders until real listings exist (edit `STORE` in apps.js).

## Implemented (2026-06) — Badges, lockout, signature guitars
- Official Apple / Google Play badge artwork (`/public/badges`) in `StoreButtons`.
- Login brute-force lockout: 5 fails per `ip:email` → 429 + Retry-After for 15 min
  (`login_attempts` collection, TTL index). Counter cleared on success.
- Shop: two signature Flying‑V guitars `galaxy-v` (user-uploaded artwork `/shop/galaxy-v.jpg`)
  and `lightning-v` (`/jamnow/flying-v.png`), $249 each, category "Signature Guitars";
  checkout prefixes relative images with origin for Stripe.
- Homepage "Guitar Stage" section (`GuitarStage.jsx`) with add-to-cart.
- Tests: iteration_3 backend 10/10, frontend all pass.
- Pending from user: real store listing URLs; approved artwork for GroovBox/Mash/Trackz/Charts.

## Backlog (P0 / P1 / P2)
- **P1** Real App Store / Google Play listing URLs per app (user to supply)
- **P1** Gallery artwork for GroovBox, GroovMash, GroovTrackz, GroovCharts (user to upload)
- **P1** Order emails on successful payment (via Resend)
- **P1** Product detail pages with reviews
- **P2** Migrate SHOP_PRODUCTS to DB with admin editor
- **P2** Move to FastAPI lifespan handlers (@on_event deprecated)
- **P2** Password reset flow (forgot-password + reset-password endpoints scaffolded but not built)

- **P2** Split server.py into routers/ modules

## Test Credentials
- Seeded admin: `admin@groovlabz.com` / `admin123`
- Endpoint: `POST /api/auth/login`
