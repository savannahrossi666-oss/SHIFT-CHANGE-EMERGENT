import { Rise } from "./MaskedReveal";

export default function Problem() {
  return (
    <section
      id="problem"
      data-testid="problem-section"
      className="relative bg-[#08090a] py-32 md:py-48 px-6 md:px-10 overflow-hidden"
    >
      {/* Faint hairline grid */}
      <div className="absolute inset-0 hairline-grid opacity-40 radial-fade pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto grid md:grid-cols-12 gap-10 md:gap-16">
        {/* Chapter label column */}
        <div className="md:col-span-3">
          <Rise>
            <div className="sticky top-32 flex flex-col gap-6">
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
                Ch. 01
              </span>
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/40 leading-relaxed">
                The<br />Broken<br />System
              </span>
              <div className="w-10 h-px bg-white/30" />
              <p className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">
                (a diagnosis)
              </p>
            </div>
          </Rise>
        </div>

        {/* Content column */}
        <div className="md:col-span-9 md:pl-10 md:border-l md:border-white/10">
          <Rise>
            <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/40 mb-8">
              The problem isn&apos;t your skills.
            </p>
          </Rise>

          <Rise delay={0.05}>
            <h2 className="font-display font-medium text-white text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.03em] text-balance max-w-5xl">
              Millions of people already have valuable{" "}
              <span className="text-white/50">skills, tools, equipment, hobbies, products,</span>{" "}
              and experience — but no fast way to{" "}
              <span className="font-serif-accent italic text-[#E4F222] font-normal">turn any of it into income.</span>
            </h2>
          </Rise>

          <div className="mt-16 md:mt-24 grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <Rise delay={0.15}>
              <div className="flex flex-col gap-4">
                <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40">
                  · Simultaneously
                </span>
                <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed">
                  Millions more <span className="text-white">need everyday help</span> — but don&apos;t want to overpay large companies or spend hours searching across a dozen websites.
                </p>
              </div>
            </Rise>

            <Rise delay={0.25}>
              <div className="relative border border-white/10 bg-white/[0.02] p-8 md:p-10">
                <span className="absolute -top-3 left-8 bg-[#08090a] px-3 font-mono-accent text-[10px] uppercase tracking-[0.3em] text-[#E4F222]">
                  Shift Change
                </span>
                <p className="font-display text-2xl md:text-3xl leading-tight tracking-tight text-white">
                  connects <span className="text-[#E4F222]">both.</span>
                </p>
                <p className="mt-6 font-mono-accent text-[11px] uppercase tracking-[0.22em] text-white/40">
                  One workspace · One reputation · One community
                </p>
              </div>
            </Rise>
          </div>
        </div>
      </div>
    </section>
  );
}
