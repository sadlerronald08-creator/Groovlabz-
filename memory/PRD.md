# GroovSesh — Product Requirements (living doc)

## Original problem statement
GroovSesh — a simplified multitrack recording studio in the GroovLabz suite, with a signature Flying-V-neck interface. Record layers from mic / plugged-in guitar / imported audio, light editing, then save, export, or hand stems to GroovTracks. Free tier + paid Pro tier. Galaxy/neon branding, infinity logo, clickable GroovLabz watermark.

## Locked user choices
- Audio: Expo audio stack now (real mic record, layered multitrack playback, per-track volume/mute/solo, mixdown); native low-latency engine later.
- Auth: BOTH email/password (custom JWT) AND Emergent-managed Google login. Single "GroovLabz" universal account.
- Pro billing: Emergent-managed RevenueCat auto-renewable subscription (entitlement `pro`), monthly + yearly.
- Free-tier track limit: 4.
- Screens: all locked screens (Flying-V home, JAM NOW, Multitrack session, Clip editing, Export/Share).

## Brand
- App name: **GROOVSESH** (no "e"). Suite: **GROOVLABZ** (no "e", ends "Z"). Sub-app: **GroovTracks**.
- Galaxy nebula theme: bundled procedurally generated nebula background (assets/images/galaxy-bg.jpg) — magenta/violet/cyan/green clouds + starfield.
- Fonts (bundled locally, no network): Rajdhani (display) + IBM Plex Sans (body).

## Architecture
- Frontend: Expo Router (React Native + TS). Screens in /app. Shared code in /src. Theme in src/theme.ts. RevenueCat in lib/revenuecat.tsx.
- Backend: FastAPI, all routes under /api. Token-based auth (random bearer token in `user_sessions`, 7-day expiry) for both email/password and Google.
- DB: MongoDB. Models: users, user_sessions, groove_sessions (projects), tracks. Soft-delete via `deleted_at`.
- Storage: Emergent Managed Object Storage for audio takes/stems. Audio served via GET /api/audio/{track_id}?token=.
- Payments: RevenueCat (entitlement `pro`, client-side gating). Provisioned bundle id com.emergent.jamnowstudio.fr57we.

## Implemented (2026-06-23)
- Auth: register/login/me/logout, Emergent Google OAuth session exchange, protected routes (401 without token), cross-user isolation. [tested 21/21 backend]
- Flying-V neck home: glowing JAM NOW headstock (one-tap on open) + 5 fret buttons (New Session, My Sessions, Import, Tracks, Settings). SVG neck + frets + strings + inlay.
- JAM NOW: contextual mic permission (grant/deny/blocked→Open Settings), live waveform, timer, stop → save-as-session (uploads take).
- Multitrack session: track lanes w/ waveform, per-track mute/solo/volume slider, transport (play multitrack / record new track / metronome / count-in), free 4-track limit → paywall.
- Clip editing: zoomed waveform, trim handles (Pro), EQ/Reverb toggles (Pro), gain slider (free), save.
- Export/Share: Export Audio (free, share via expo-sharing), Send Stems to GroovTracks (Pro), Lossless WAV (Pro locked).
- My Sessions: list, pull-to-refresh, open, soft-delete.
- Import: expo-document-picker → new session + upload.
- Settings: profile, plan status, upgrade, restore purchases, sign out. Nebula background.
- Paywall: RevenueCat offerings (monthly/yearly), purchase w/ confirm, restore.
- Global: clickable GROOVLABZ watermark on every screen, bundled fonts + nebula bg.

## Verified
- Backend: iteration_1 — 21/21 pytest pass.
- Frontend: iteration_2 (boot/fonts/bg + no crashes), iteration_3 (brand rename + nebula + smoke) — all pass.

## Backlog
- P1: Real audio mixdown for Export (currently shares stems); native low-latency engine (JUCE/Oboe/AVAudioEngine) bridged for true multitrack sync + live monitoring — needs dev build.
- P1: Interruption handling (calls / interface unplug) without losing a take; offline record + sync on reconnect.
- P2: Import format normalization; reorder tracks by drag; count-in click sound; metronome audio.
- P2: IAP restore across devices polish; App Store / Play IAP product config at publish.

## Known constraints
- Mic recording, native file picker, real IAP purchases require a real device build (not Expo Go / web preview).
- Pro entitlement is client-side (RevenueCat) by design; no server-side is_pro field.
