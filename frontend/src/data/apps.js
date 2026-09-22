import {
  Mic,
  Disc3,
  Activity,
  BookOpen,
  Radio,
} from "lucide-react";

export const APPS = [
  {
    id: "groovsesh",
    name: "GroovSesh",
    tagline: "Simplified Multi-Track Studio Recording",
    icon: Mic,
    badge: "Core DAW",
    color: "from-cyan-400 to-blue-600",
    description:
      "Zero-latency multi-track vocal and instrument recording with automated gain staging and real-time DSP effects. Made for the studio and the tour bus.",
    features: [
      "16-track audio recording",
      "Built-in tube pre-amp simulation",
      "One-touch export to WAV/MP3",
      "Cloud session sync across devices",
    ],
    image:
      "https://images.pexels.com/photos/18197122/pexels-photo-18197122.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: "groovmash",
    name: "GroovMash",
    tagline: "AI-Powered Song Mashups & Remixing",
    icon: Disc3,
    badge: "AI Remix",
    color: "from-fuchsia-400 to-purple-700",
    description:
      "Instantly isolate stems (vocals, drums, bass, keys), match key and BPM, and create studio-grade remixes on the fly. Bring the club energy.",
    features: [
      "Stem separation engine",
      "Smart key & BPM sync",
      "FX transition pad",
      "Live performance looper",
    ],
    image:
      "https://images.pexels.com/photos/11300427/pexels-photo-11300427.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: "groovtune",
    name: "GroovTune",
    tagline: "Ultra-Precise Polyphonic Instrument Tuner",
    icon: Activity,
    badge: "Pro Utility",
    color: "from-emerald-400 to-cyan-500",
    description:
      "Sub-cent accuracy tuner for guitar, bass, violin, and custom drop tunings with visual strobe feedback. Tuned in seconds, not minutes.",
    features: [
      "Sub-0.1 cent strobe accuracy",
      "50+ alternate tunings",
      "Noise cancellation algorithm",
      "Custom tuning creator",
    ],
    image:
      "https://images.pexels.com/photos/8197260/pexels-photo-8197260.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: "groovchords",
    name: "GroovChords",
    tagline: "Interactive Chords, Lyrics & Diagrams",
    icon: BookOpen,
    badge: "Songbook",
    color: "from-amber-400 to-orange-600",
    description:
      "Library of over 500,000 song chord charts, dynamic transposition, auto-scroll, and fingering variations. Never fumble a set again.",
    features: [
      "Dynamic transposition",
      "Fretboard chord visualizer",
      "Hands-free auto-scroll",
      "Setlist organizer",
    ],
    image:
      "https://images.pexels.com/photos/29205062/pexels-photo-29205062.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
  {
    id: "groovguitar",
    name: "GroovGuitar",
    tagline: "Guitar Emulation & Bluetooth Hardware Link",
    icon: Radio,
    badge: "Hardware Sync",
    color: "from-rose-400 to-red-600",
    description:
      "Virtual amp modeling, stompbox effects rack, and seamless Bluetooth low-latency connection to GroovPuck hardware. Studio tones anywhere.",
    features: [
      "24 amp models & IR cabinets",
      "Bluetooth 5.3 ultra-low latency",
      "Expression pedal MIDI sync",
      "Tone sharing community",
    ],
    image:
      "https://images.pexels.com/photos/13981274/pexels-photo-13981274.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  },
];
