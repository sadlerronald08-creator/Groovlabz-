import { Waves, HeadphonesIcon, Wrench, Users } from "lucide-react";

export default function About() {
  return (
    <div className="pt-24 pb-16" data-testid="about-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-14">
          <p className="mono-label mb-3">About GroovLabz</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            We build tools for musicians who <span className="text-cyan-300">refuse to compromise.</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            GroovLabz started in a two-room studio in Nashville with a single
            question: why does professional music software still feel like it
            was designed in 1998? Five apps, one Bluetooth-linked hardware
            family, and two million musicians later — we're still asking.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {[
            {
              icon: Waves,
              title: "Sound first, software second.",
              body: "Every DSP algorithm is auditioned by working engineers before it ships. If it doesn't sound as good as rack gear, it doesn't ship.",
            },
            {
              icon: HeadphonesIcon,
              title: "Made for headphones AND stages.",
              body: "Every app is tested on cheap earbuds and $2,000 monitors alike. Great tone should work everywhere.",
            },
            {
              icon: Wrench,
              title: "One ecosystem, five specialists.",
              body: "Rather than one bloated DAW, we build focused apps that share sessions. Your workflow, your rules.",
            },
            {
              icon: Users,
              title: "Musicians. Not just customers.",
              body: "Half the team plays live weekly. Every feature is battle-tested in green rooms and tour buses before it hits your device.",
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
            <span className="text-cyan-300">"Great tools disappear."</span> Ours
            get out of your way and let you make the record you hear in your head.
          </p>
        </div>
      </div>
    </div>
  );
}
