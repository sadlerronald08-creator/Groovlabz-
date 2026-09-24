# GroovSesh — Store Listing & Submission Kit

## Identity
- **Name:** GroovSesh
- **Subtitle (iOS, ≤30):** One‑tap music capture
- **Bundle / package:** `com.emergent.jamnowstudio.fr57we` (iOS bundleIdentifier + Android package — keep identical to the RevenueCat config)
- **Category:** Music · **Age rating:** 4+ / Everyone
- **Support URL:** https://groovlabs.com/contact · **Marketing URL:** https://groovlabs.com/apps/groovsesh
- **Privacy policy:** https://groovlabs.com/legal/privacy · **Terms:** https://groovlabs.com/legal/terms
- **Support email:** support@groovlabz.com (create the mailbox before submission)

## Short description (Google Play, ≤80)
Record ideas in seconds. Stack takes, loop, tune, export stems to GroovMash.

## Full description (≤4000)
From a trip to a riff. Recording has never been easier.

GroovSesh is the fastest way to get a musical idea out of your head and onto a track. Open the app, tap JAM NOW, and you're recording — no setup, no menus, no manual. When the idea's down, stack more takes on top, clean them up, and hand the stems off to GroovMash to finish.

CAPTURE · CREATE · PLAY · REPEAT
• JAM NOW — one tap opens the tuner, metronome and recorder together
• RECORD SOMETHING — capture a take with a 4‑beat count‑in and real woodblock click
• QUICK JAMS — every take, listed by date; play, rename, delete
• SESSION REEL — stack takes into multitrack sessions, trim, mute/solo, set levels
• LOOPER — record a phrase, it loops instantly; stack layers in time
• TUNER & METRONOME — strobe‑style tuner and a metronome with tap tempo
• SONGBOOK & SETLISTS — keep chords, keys and lyrics; build a set and run it on stage
• NEURAL CLEAN — reduce noise, hum and wind on export
• EXPORT — MP3 mixdown free; lossless WAV and stem hand‑off to GroovMash with Pro
• COLLAB — invite a bandmate to jam on your session

Part of the GroovLabz ecosystem: GroovSesh, GroovBox, GroovMash, GroovTrackz and GroovCharts — one account, one electric‑blue signal chain. Pair with GroovLabz Bluetooth guitars, mics and amps for a wireless rig.

GroovSesh Pro (optional subscription) unlocks unlimited tracks per session, lossless WAV export and stem hand‑off to GroovMash. Payment is charged to your App Store / Google Play account; subscriptions renew automatically unless cancelled at least 24 hours before the end of the period.

## Keywords (iOS, ≤100 chars)
recorder,multitrack,looper,tuner,metronome,songwriting,riff,jam,stems,guitar,music maker

## Screenshots to capture (use the approved artwork screens in the app)
1. Home — Flying‑V node menu (index)
2. Quick Jams — takes list with action bar
3. Session — multitrack lanes recording
4. Looper — loop rolling with 2 layers
5. Export & Share — Send Stems to GroovMash highlighted
6. Songbook / Setlist run mode
Sizes: iPhone 6.7" (1290×2796), iPhone 6.5" (1284×2778), Android phone (1080×1920+), 7" tablet optional.

## In‑app purchases (RevenueCat entitlement `pro`)
| Product ID | Type | Suggested price |
| --- | --- | --- |
| `groovsesh_pro_monthly` | auto‑renewing subscription | $4.99 / month |
| `groovsesh_pro_yearly` | auto‑renewing subscription | $29.99 / year |
Create in App Store Connect (Subscriptions → group "GroovSesh Pro") and Play Console (Monetize → Subscriptions), then attach to the RevenueCat offering `default`.

## Build & submit
```bash
cd frontend
npm i -g eas-cli && eas login
# set the deployed backend URL in eas.json (EXPO_PUBLIC_BACKEND_URL) — replace all REPLACE_WITH_* values
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
Backend must be deployed with `ffmpeg` available (mixdown/stems use pydub) and `EMERGENT_LLM_KEY` for object storage.

## Review notes (paste into App Review)
Demo account: create one via the in‑app Sign Up. Microphone is required for recording; no account data is shared with third parties. Subscriptions are managed by RevenueCat; sandbox purchases work with the `pro` entitlement.

## After approval
Paste the App Store URL (`https://apps.apple.com/us/app/groovsesh/id…`) and Play URL (`https://play.google.com/store/apps/details?id=com.emergent.jamnowstudio.fr57we`) into the GroovLabz website: Account → Store links.
