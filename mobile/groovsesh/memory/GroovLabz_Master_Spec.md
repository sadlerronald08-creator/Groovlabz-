# GroovLabz — Master Lab Foundation (Authoritative Spec)
_Source: user-provided GroovLabz Master Foundation (Draft 1). This is the spec GroovSesh is built against._

## What GroovLabz Is
One connected music-creation environment made of FIVE specialized apps that share a visual identity, interaction principles, and purpose (idea/reference → sound creation → practice → recording → cleanup → mixing → organization → reusable material).

- **This project = GroovSesh only.** The other four are separate builds (one project each, later).
- **Artwork is the visual source of truth**: approved interface artwork is the visible front layer; functional controls are layered over it (do not replace with generic cards).
- **Promise-to-function rule**: every labeled control does what its label says. No dead buttons, no generic reused destination, no fake success. Be honest about browser/platform limits (e.g., mic permission) instead of pretending.
- **GR∞VLABZ mark = home control.** Assets use valid relative paths. Deploy only after asset/path/link/function verification passes.

## The Five Components
| Component | Primary Job | Core Operations |
|---|---|---|
| **GroovSesh** | Capture & develop ideas | Record, review, clean, studio/mix, session organization, collaboration, export |
| **GroovBox** | Shape instrument tone | Presets, pedals, amps, cabs, signal chain, knobs, tuner, looper |
| **GroovMash** | Process & assemble audio | Strip stems, clean, isolate, blend, preview, export |
| **GroovTrackz** | Find & practice with tracks | Search, select, play, loop, practice, jam, save sessions |
| **GroovCharts** | Musical reference/performance | Songs, chords, tabs, lyrics, scales, keys, transpose, progressions |

## GroovSesh — full functional contract (THIS app)
Home nodes & their jobs (each its OWN destination, no generic screen):
- **JAM NOW** — active jam/capture (includes Tuner + Metronome access).
- **RECORD SOMETHING** — real microphone take when browser/device allows.
- **REVIEW TAKES** — recorded-take workflow: play / rename / delete.
- **NEURAL CLEAN** — supported audio cleaning; DO NOT call a browser approximation production neural DSP.
- **MIXER / STUDIO** — place/manipulate a take in the studio (per-track volume/mute/solo + effects).
- **SESSION REEL** — organize/arrange the session's material (reorder lanes).
- **COLLAB** — collaboration/sharing/import.
- **QUICK JAMS** — expose saved/available takes, playable/selectable.
- **EXPORT TO GROOVMASH** — real export/handoff (mixdown; WAV = Pro).
Bottom tabs (each its own destination): **HOME / TUNER / METRONOME / LOOPER / SONGBOOK / SETLISTS**.
- Tuner = real mic pitch detection (honest about capability). Metronome = real audible clicks. Looper = real mic capture/playback. Songbook & Setlists = persistent local data. Settings = recording-storage controls.

## Interaction & Navigation Rules
No dead buttons; no generic reused destination; controls lead to the specific named destination; approved artwork stays visible with controls layered over it; GR∞VLABZ mark returns home; every asset resolves from packaged relative path; state-changing controls truly change state; browser limits communicated honestly.

## Data / State Foundation (stateful tools, not slideshows)
- GroovSesh: takes, names, saved recordings, selected take, studio placement, export state.
- (Other apps' state defined in full doc: GroovBox presets/chain; GroovMash stems/blend; GroovTrackz tracks/sessions; GroovCharts key/transpose/progression.)

## Quality Gate (every build)
Inspect every control → verify every route → verify each destination has its own view/function → verify asset paths → verify approved artwork → no baked-in active state → test media ops with real sample media → verify persistence → verify export/handoff → honest capability handling → re-scan after fixes → package only after full pass.

## Proofread / Confirm carefully
Final sub-feature names; cross-app handoffs beyond the documented GroovSesh → GroovMash; account/cloud behavior if planned; verbally-discussed functions not in the current contract.

## Build note for GroovSesh (this project)
User will provide approved interface IMAGES for each screen. Build/rework each remaining screen AGAINST the supplied artwork (do not invent UI) to avoid design mismatch. Already real: Record, Review (play/rename/delete), Mixer (session), Export mixdown (MP3/WAV), Metronome, Collab share. Pending real artwork+function: Neural Clean, Session Reel view, Tuner (mic pitch), Looper, Songbook, Setlists persistence.
