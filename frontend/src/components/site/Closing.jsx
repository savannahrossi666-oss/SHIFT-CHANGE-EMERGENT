import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Rise } from "./MaskedReveal";
import { ArrowUpRight } from "lucide-react";

const THINGS = [
  "your camera.",
  "your truck.",
  "your laptop.",
  "your toolbox.",
  "your creativity.",
  "your knowledge.",
  "your equipment.",
  "your experience.",
  "your spare time.",
];

export default function Closing() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Scale down the giant headline as it enters
  const scale = useTransform(scrollYProgress, [0.1, 0.5], [1.4, 1]);
  const opacity = useTransform(scrollYProgress, [0.05, 0.35], [0, 1]);

  return (
    <section
      id="closing"
      ref={ref}
      data-testid="closing-section"
      className="relative bg-[#08090a] py-32 md:py-56 px-6 md:px-10 overflow-hidden"
    >
      {/* Ambient spotlight */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(228,242,34,0.06),transparent_60%)]"
      />
      <div className="absolute inset-0 hairline-grid opacity-30 radial-fade pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto">
        <Rise>
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] text-center mb-12">
            Ch. 06 — Look around
          </p>
        </Rise>

        <motion.h2
          style={{ scale, opacity }}
          className="text-center font-display font-medium text-white text-5xl md:text-8xl lg:text-[9rem] leading-[0.9] tracking-[-0.045em] max-w-6xl mx-auto"
        >
          Opportunity is <span className="font-serif-accent italic text-[#E4F222] font-normal">already</span> around you.
        </motion.h2>

        <Rise delay={0.2}>
          <p className="mt-16 md:mt-24 text-center font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/40">
            It might be…
          </p>
        </Rise>

        {/* Kinetic list of things */}
        <div className="mt-10 md:mt-14 max-w-4xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-3">
          {THINGS.map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-medium text-white/85 text-3xl md:text-5xl tracking-[-0.03em] hover:text-[#E4F222] transition-colors cursor-default"
            >
              {t}
            </motion.span>
          ))}
        </div>

        <Rise delay={0.15}>
          <p className="mt-20 md:mt-28 text-center max-w-2xl mx-auto text-white/60 text-lg md:text-xl font-light leading-relaxed">
            The opportunity <span className="text-white">already</span> exists.
            <br />
            Shift Change helps you <span className="font-serif-accent italic text-[#E4F222]">unlock</span> it.
          </p>
        </Rise>

        <Rise delay={0.25}>
          <div className="mt-14 md:mt-20 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#audiences"
              data-testid="closing-cta-primary"
              className="group inline-flex items-center gap-6 bg-[#E4F222] text-[#08090a] px-8 py-5 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors"
            >
              Start creating opportunity
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
            </a>
            <a
              href="#top"
              data-testid="closing-cta-secondary"
              className="group inline-flex items-center gap-4 border border-white/20 text-white px-8 py-5 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:border-[#E4F222] hover:text-[#E4F222] transition-colors"
            >
              Re-read the manifesto
              <span className="inline-block group-hover:-translate-y-0.5 transition-transform">↑</span>
            </a>
          </div>
        </Rise>
      </div>
    </section>
  );
}
