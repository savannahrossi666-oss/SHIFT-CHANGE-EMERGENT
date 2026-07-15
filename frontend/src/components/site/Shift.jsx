import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { Rise } from "./MaskedReveal";

export default function Shift() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Old-question fades out; new-question glows in as user scrolls through
  const oldOpacity = useTransform(scrollYProgress, [0.15, 0.45], [1, 0.15]);
  const oldStrike = useTransform(scrollYProgress, [0.2, 0.5], [0, 1]);
  const newOpacity = useTransform(scrollYProgress, [0.35, 0.65], [0, 1]);
  const newY = useTransform(scrollYProgress, [0.35, 0.65], [40, 0]);

  return (
    <section
      id="shift"
      ref={ref}
      data-testid="shift-section"
      className="relative bg-[#08090a] py-32 md:py-56 px-6 md:px-10 overflow-hidden border-y border-white/10"
    >
      {/* SLOW EDITORIAL MARQUEE (single, outline only) */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      >
        <Marquee gradient={false} speed={18} className="opacity-100">
          <span
            className="font-display text-[22vw] md:text-[16vw] leading-none tracking-[-0.06em] font-semibold uppercase whitespace-nowrap pr-16"
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.14)",
              color: "transparent",
            }}
          >
            Opportunity Workspace ·&nbsp;
          </span>
          <span
            className="font-display text-[22vw] md:text-[16vw] leading-none tracking-[-0.06em] font-semibold uppercase whitespace-nowrap pr-16"
            style={{
              WebkitTextStroke: "1px rgba(228,242,34,0.28)",
              color: "transparent",
            }}
          >
            The Shift ·&nbsp;
          </span>
        </Marquee>
      </div>

      <div className="relative max-w-[1240px] mx-auto text-center">
        <Rise>
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-6 md:mb-10">
            Ch. 02 — The Shift
          </p>
        </Rise>

        <Rise>
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.25em] text-white/40 mb-8">
            Instead of asking…
          </p>
        </Rise>

        <motion.h2
          style={{ opacity: oldOpacity }}
          className="relative inline-block font-display font-medium text-white/70 text-5xl md:text-8xl lg:text-9xl leading-none tracking-[-0.04em]"
        >
          Who&apos;s hiring?
          <motion.span
            style={{ scaleX: oldStrike, transformOrigin: "left" }}
            className="absolute left-0 right-0 top-1/2 h-[3px] md:h-[5px] bg-[#FF3B30]"
          />
        </motion.h2>

        <div className="my-12 md:my-16 flex flex-col items-center gap-4">
          <div className="h-14 w-px bg-gradient-to-b from-white/40 to-transparent" />
          <span className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40">
            Ask instead
          </span>
          <div className="h-14 w-px bg-gradient-to-b from-[#E4F222]/60 to-transparent" />
        </div>

        <motion.div style={{ opacity: newOpacity, y: newY }}>
          <h2 className="font-display font-medium text-white text-5xl md:text-8xl lg:text-[9rem] leading-[0.95] tracking-[-0.045em]">
            What can I <span className="font-serif-accent italic text-[#E4F222] font-normal">offer</span>
            <br />
            today?
          </h2>
          <p className="mt-10 md:mt-14 max-w-2xl mx-auto text-white/60 text-base md:text-lg font-light leading-relaxed">
            The emotional turn: you are not a résumé waiting to be picked. You are a set of capabilities, tools and hours — and every single one of them has a market.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
