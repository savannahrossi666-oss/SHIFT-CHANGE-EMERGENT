import { Rise } from "./MaskedReveal";

const CHAPTERS = [
  {
    n: "i.",
    text: (
      <>
        No one with valuable skills should struggle to earn money because they don&apos;t know <span className="font-serif-accent italic text-[#E4F222]">where to start.</span>
      </>
    ),
  },
  {
    n: "ii.",
    text: <>People shouldn&apos;t have to wait <span className="text-white">weeks</span> for interviews.</>,
  },
  {
    n: "iii.",
    text: <>Or create <span className="text-white">dozens</span> of freelance accounts.</>,
  },
  {
    n: "iv.",
    text: <>Or feel like their skills are <span className="text-white/50 line-through decoration-[#FF3B30]/60">going to waste.</span></>,
  },
  {
    n: "v.",
    text: (
      <>
        Shift Change helps people <span className="font-serif-accent italic text-[#E4F222]">unlock</span> the value they already possess.
      </>
    ),
  },
];

export default function Mission() {
  return (
    <section
      id="manifesto"
      data-testid="mission-section"
      className="relative bg-[#08090a] py-32 md:py-56 px-6 md:px-10 overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto">
        <Rise>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 mb-20 md:mb-32">
            <div>
              <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
                Ch. 04 — Manifesto
              </p>
              <h2 className="mt-6 font-display font-medium text-white text-4xl md:text-6xl leading-[1.02] tracking-[-0.03em] max-w-3xl">
                People already have value.<br />
                <span className="text-white/50">They just don&apos;t have the infrastructure to turn it into income.</span>
              </h2>
            </div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40 md:text-right">
              5 chapters<br />
              <span className="text-white/25">read slowly ↓</span>
            </div>
          </div>
        </Rise>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {CHAPTERS.map((ch, i) => (
            <Rise key={ch.n} delay={0.05 * i}>
              <div className="group grid grid-cols-12 gap-6 py-10 md:py-16 hover:bg-white/[0.015] transition-colors">
                <div className="col-span-2 md:col-span-1 flex items-start">
                  <span className="font-serif-accent italic text-white/40 text-2xl md:text-4xl group-hover:text-[#E4F222] transition-colors">
                    {ch.n}
                  </span>
                </div>
                <div className="col-span-10 md:col-span-11">
                  <p className="font-display font-medium text-white text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.03em] text-balance">
                    {ch.text}
                  </p>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}
