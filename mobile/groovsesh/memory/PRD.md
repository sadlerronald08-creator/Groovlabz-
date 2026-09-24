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
- Backend: iteration_1 (21/21), iteration_4 (29/29 — incl. reorder + mixdown + get_mixdown).
- Frontend: iteration_2, iteration_3, iteration_4 — all pass.

## Update 2026-06-23 (v1.2 — match approved artwork)
- User provided approved mockup (GroovLabz zip). Layering rules: approved interface artwork is the FRONT/source of truth; functional controls are TRANSPARENT overlays on top; no generic card UI in front of artwork.
- Extracted approved panels -> /app/frontend/assets/images/groovsesh-home.png (+ quickjams, export crops available).
- Rebuilt app/index.tsx: home now renders groovsesh-home.png (photorealistic blue-lightning Flying V studio scene) full-bleed, contain-fit, with transparent tap overlays positioned by fraction on each neck play-node (JAM NOW, Record Something, Review Takes, Neural Clean, Mixer/Studio, Session Reel, Collab), settings gear, hamburger, Quick Jams badge, GroovLabz stool watermark, and the 6 bottom tabs. Verified JAM NOW overlay -> /jam.
- TODO (opt-in): apply same artwork-front approach to Quick Jams (recordings) + Export->GroovMash (Neural Clean/Strip stems) screens; shift palette to electric-blue to match; rename stem hand-off "GroovMash".
- Redesign: Orbitron display font (bundled), animated neon SVG infinity logo, animated starfield background, gradient glowing buttons, staggered entrance animations.
- Flying-V home: real Flying-V guitar (galaxy V-body + neon edge, pointed headstock w/ tuning pegs housing JAM NOW, strings, pickups, knobs, infinity inlay) in src/components/flying-v.tsx.
- Real mixdown: backend pydub/ffmpeg — POST /api/sessions/{id}/mixdown?format=mp3|wav (applies volume/mute/solo/gain/trim), GET /api/mixdown/{id}. Export screen wired (MP3 free, WAV Pro-gated).
- Procedural galaxy session cover art (SessionCover) seeded per session id — shown in My Sessions.
- Drag-reorder track lanes (react-native-draggable-flatlist) + POST /api/sessions/{id}/reorder.
- Audible metronome + count-in (src/audio/metronome.ts, bundled click wavs).
- DEPLOY NOTE: mixdown needs ffmpeg on the server; preview has it. If production build lacks ffmpeg, mixdown returns 500 — ensure ffmpeg present in deploy image.

## Backlog
- P1: Real audio mixdown for Export (currently shares stems); native low-latency engine (JUCE/Oboe/AVAudioEngine) bridged for true multitrack sync + live monitoring — needs dev build.
- P1: Interruption handling (calls / interface unplug) without losing a take; offline record + sync on reconnect.
- P2: Import format normalization; reorder tracks by drag; count-in click sound; metronome audio.
- P2: IAP restore across devices polish; App Store / Play IAP product config at publish.

## Known constraints
- Mic recording, native file picker, real IAP purchases require a real device build (not Expo Go / web preview).
- Pro entitlement is client-side (RevenueCat) by design; no server-side is_pro field.
