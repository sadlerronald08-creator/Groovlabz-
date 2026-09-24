import { Waves, HeadphonesIcon, Wrench, Users } from "lucide-react";

export default function About() {
  return (
    <div className="pt-24 pb-16" data-testid="about-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="mono-label mb-3">About GroovLabz</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            From a trip <span className="text-cyan-300">to a riff.</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-5" data-testid="about-origin-story">
            GroovLabz didn't start in a boardroom. It started on an acid trip.
            Somewhere in the middle of it I was imagining a music‑recording app so
            simple and friendly you could use it while tripping — one tap, and the
            idea is captured before it's gone. That vision became{" "}
            <span className="text-cyan-300 font-semibold">GroovSesh</span>.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed">
            GroovSesh led to four more apps — GroovBox, GroovMash, GroovTrackz and
            GroovCharts — and suddenly I needed a home for all of them. So I built
            this one. Recording has never been easier.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {[
            {
              icon: Waves,
              title: "One tap, no manual.",
              body: "If you can't figure it out in an altered state, it's too complicated. Every screen is designed to be understood instantly.",
            },
            {
              icon: HeadphonesIcon,
              title: "Capture first, polish later.",
              body: "Ideas are fragile. GroovSesh gets the take down in seconds — cleanup, stems and mixing come afterwards in the other apps.",
            },
            {
              icon: Wrench,
              title: "One ecosystem, five specialists.",
              body: "Rather than one bloated DAW, we build focused apps that share sessions. Your workflow, your rules.",
            },
            {
              icon: Users,
              title: "Built by a musician, for musicians.",
              body: "Every feature exists because it was needed mid‑jam. Nothing ships that gets in the way of the riff.",
            },
          ].map((p) => {
            const I = p.icon;
            return (
              <div key={p.title} className="metal-border rounded-2xl p-6">
                <I className="w-6 h-6 text-cyan-300 mb-3" />
                <h3 className="display text-xl font-extrabold mb-2">
                  {p.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
              </div>
            );
          })}
        </div>

        <div className="metal-border rounded-2xl p-8 text-center">
          <p className="mono-label mb-3">Manifesto</p>
          <p className="display text-2xl sm:text-3xl font-black leading-tight max-w-3xl mx-auto">
            <span className="text-cyan-300">"From a trip to a riff."</span> Recording
            has never been easier — get the idea down before it disappears.
          </p>
        </div>
      </div>
    </div>
  );
}
