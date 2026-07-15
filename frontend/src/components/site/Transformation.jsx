import { Rise } from "./MaskedReveal";

const OLD_WAY = [
  "Search multiple websites.",
  "Wait for interviews.",
  "Pay expensive businesses.",
  "Hope someone responds.",
];

const NEW_WAY = [
  "One workspace.",
  "One profile.",
  "One reputation.",
  "One place to earn.",
  "One place to hire.",
  "One community.",
];

export default function Transformation() {
  return (
    <section
      id="transformation"
      data-testid="transformation-section"
      className="relative bg-[#08090a] py-32 md:py-48 px-6 md:px-10 border-y border-white/10"
    >
      <div className="max-w-[1440px] mx-auto">
        <Rise>
          <div className="max-w-3xl mb-16 md:mb-24">
            <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
              Ch. 05 — The Transformation
            </p>
            <h2 className="mt-6 font-display font-medium text-white text-4xl md:text-6xl leading-[1.02] tracking-[-0.03em]">
              We aren&apos;t comparing features.<br />
              <span className="text-white/50">We&apos;re offering</span>{" "}
              <span className="font-serif-accent italic text-[#E4F222] font-normal">a different life.</span>
            </h2>
          </div>
        </Rise>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-10 md:gap-16 items-stretch">
          {/* OLD WAY */}
          <Rise>
            <div className="relative h-full grayscale opacity-70 hover:opacity-90 transition-opacity">
              <div className="border border-white/10 bg-white/[0.015] p-8 md:p-12 h-full">
                <div className="flex items-center justify-between">
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40">
                    /01 — Old way
                  </span>
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-[#FF3B30]/70">
                    Deprecated
                  </span>
                </div>
                <h3 className="mt-8 font-display text-3xl md:text-4xl text-white/50 tracking-tight leading-tight">
                  The endless<br />hustle loop.
                </h3>
                <ul className="mt-10 space-y-4">
                  {OLD_WAY.map((line) => (
                    <li key={line} className="flex items-center gap-4 text-white/60 line-through decoration-[#FF3B30]/50 decoration-[1.5px]">
                      <span className="w-4 h-px bg-white/30" />
                      <span className="font-display text-lg md:text-2xl tracking-tight">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Rise>

          {/* Arrow */}
          <div className="flex md:flex-col items-center justify-center gap-2">
            <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-white/40 to-transparent" />
            <span className="font-serif-accent italic text-[#E4F222] text-4xl md:text-6xl">→</span>
            <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-[#E4F222]/40 to-transparent" />
          </div>

          {/* NEW WAY */}
          <Rise delay={0.1}>
            <div className="relative h-full">
              <div className="relative border border-[#E4F222]/40 bg-[#E4F222]/[0.03] p-8 md:p-12 h-full overflow-hidden">
                <div
                  aria-hidden
                  className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#E4F222]/10 blur-3xl"
                />
                <div className="relative flex items-center justify-between">
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-[#E4F222]">
                    /02 — Shift Change
                  </span>
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/70">
                    Now live
                  </span>
                </div>
                <h3 className="relative mt-8 font-display text-3xl md:text-4xl text-white tracking-tight leading-tight">
                  One workspace,<br />
                  <span className="font-serif-accent italic text-[#E4F222] font-normal">one you.</span>
                </h3>
                <ul className="relative mt-10 space-y-4">
                  {NEW_WAY.map((line, i) => (
                    <li key={line} className="flex items-center gap-4 text-white">
                      <span className="font-mono-accent text-[10px] text-[#E4F222] w-6">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-lg md:text-2xl tracking-tight">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Rise>
        </div>
      </div>
    </section>
  );
}
