import { Mic, SlidersHorizontal, Scissors, Disc3, BookOpen } from "lucide-react";

const STORE = {
  ios: "https://www.apple.com/app-store/",
  android: "https://play.google.com/store",
};

export const APPS = [
  {
    id: "groovsesh",
    name: "GroovSesh",
    tagline: "Capture & develop your ideas",
    motto: "CAPTURE · CREATE · PLAY · REPEAT",
    icon: Mic,
    badge: "Capture",
    color: "from-cyan-400 to-blue-600",
    accent: "#2DA4FF",
    description:
      "A simplified multitrack studio with the signature Flying‑V neck interface. Record from mic or plugged‑in guitar, review takes, clean them up, mix in the studio and hand stems to GroovMash.",
    features: [
      "JAM NOW one-tap capture with tuner & metronome",
      "Multitrack lanes with mute / solo / volume",
      "Neural Clean noise & wind reduction",
      "Session Reel arranging + Collab sharing",
      "Export MP3 / lossless WAV to GroovMash",
    ],
    store: STORE,
    artwork: "/jamnow/groovsesh-home.png",
    frame: [330, 511],
    gallery: [
      { src: "/jamnow/groovsesh-home.png", label: "Flying‑V Home" },
      { src: "/jamnow/groovsesh-quickjams.png", label: "Quick Jams" },
      { src: "/jamnow/groovsesh-export.png", label: "Export to GroovMash" },
    ],
  },
  {
    id: "groovbox",
    name: "GroovBox",
    tagline: "Shape your instrument tone",
    motto: "YOUR GUITAR · YOUR TONE · NO LIMITS",
    icon: SlidersHorizontal,
    badge: "Tone",
    color: "from-sky-400 to-blue-700",
    accent: "#54BAFF",
    description:
      "Guitar effects evolved. Presets, a drag‑to‑reorder signal chain, amps, cabs and IRs — driven by the GroovBox Bluetooth / USB tone box for low‑latency tone anywhere.",
    features: [
      "Factory, user & favorite preset banks",
      "Drag‑to‑reorder signal chain: comp, drive, mod, delay, reverb",
      "Amp heads, cabinets, IRs & mic placement",
      "Global input/output, noise gate, tuner & tap tempo",
      "Bluetooth, USB and low‑latency GroovBox hardware",
    ],
    store: STORE,
    artwork: "/jamnow/groovbox-home.jpg",
    frame: [330, 660],
    landscape: { src: "/jamnow/groovbox-home.jpg", label: "GroovBox tablet studio view" },
  },
  {
    id: "groovmash",
    name: "GroovMash",
    tagline: "Process & assemble audio",
    motto: "CLEAN · STRIP · CREATE",
    icon: Scissors,
    badge: "Create",
    color: "from-fuchsia-400 to-purple-700",
    accent: "#C978FF",
    description:
      "Turn any song into yours. Import, split stems, clean the audio with AI de‑noise, build mashups and export stems or a full mix back into the GroovLabz system.",
    features: [
      "Stem split: vocals, drums, bass, guitar, other",
      "AI Audio Cleanup with adjustable noise reduction",
      "Original vs. stems A/B with per‑stem toggles",
      "Mashup builder with synced playback",
      "Export WAV / MP3, single mix or multiple stem files",
    ],
    store: STORE,
    artwork: "/jamnow/groovmash-home.png",
    frame: [330, 660],
    gallery: [
      { src: "/jamnow/groovmash-home.png", label: "GroovMash Home" },
      { src: "/jamnow/groovsesh-export.png", label: "Hand‑off from GroovSesh" },
    ],
  },
  {
    id: "groovtrackz",
    name: "GroovTrackz",
    tagline: "Find & practice with tracks",
    motto: "FIND · PLAY · PRACTICE · IMPROVE",
    icon: Disc3,
    badge: "Practice",
    color: "from-cyan-300 to-sky-600",
    accent: "#66CAFF",
    description:
      "Backing tracks for every player. Search by song, artist or style, browse genres from rock to reggae, and jam along with featured tracks that show BPM and key at a glance.",
    features: [
      "Search by song, artist or style with filters",
      "Genre tiles: Rock, Blues, Country, Metal, Pop, Jazz, Funk, Hip Hop, Reggae",
      "Featured tracks with waveform, BPM and key",
      "Playlists and My Tracks library",
      "Practice, jam, learn — create, repeat",
    ],
    store: STORE,
    artwork: "/jamnow/groovtrackz-home.png",
    frame: [330, 660],
  },
  {
    id: "groovcharts",
    name: "GroovCharts",
    tagline: "Musical reference & performance",
    motto: "CHORDS · TABS · LYRICS · PROGRESSIONS",
    icon: BookOpen,
    badge: "Reference",
    color: "from-blue-400 to-indigo-700",
    accent: "#38BDF8",
    description:
      "Play what moves you. Trending songs with chords, tabs and lyrics, plus a toolkit of Chord Finder, Scale Library, Metronome, Circle of 5ths and Song Key Analyzer.",
    features: [
      "Search songs, artists or chords",
      "Chords, tabs, lyrics, scales & progressions views",
      "Trending songs with key and one‑tap chord sheets",
      "Tools: Chord Finder, Scale Library, Circle of 5ths",
      "Song Key Analyzer, favorites & playlists",
    ],
    store: STORE,
    artwork: "/jamnow/groovcharts-home.png",
    frame: [330, 660],
  },
];

export const getApp = (id) => APPS.find((a) => a.id === id);
