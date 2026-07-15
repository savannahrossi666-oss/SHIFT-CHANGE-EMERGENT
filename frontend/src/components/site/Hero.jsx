import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MaskedReveal } from "./MaskedReveal";
import { ArrowUpRight, ArrowDown } from "lucide-react";

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Subtle parallax: video zooms out from 1.15 -> 1.0, then drifts up
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.15, 1.0]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.55, 0.9]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="top"
      ref={ref}
      data-testid="hero-section"
      className="relative h-[100svh] min-h-[720px] w-full overflow-hidden bg-[#050505]"
    >
      {/* Video / fallback layer */}
      <motion.div
        style={{ scale: videoScale, y: videoY }}
        className="absolute inset-0 will-change-transform"
      >
        <video
          data-testid="hero-video"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1634021086770-12b626224f7a?auto=format&fit=crop&w=1920&q=80"
        >
          <source src="/webpage.mp4" type="video/mp4" />
        </video>
        {/* Fallback image (visible if video fails) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1634021086770-12b626224f7a?auto=format&fit=crop&w=1920&q=80')",
          }}
        />
      </motion.div>

      {/* Dark grade overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,9,10,0.35),rgba(8,9,10,0.85)_65%,rgba(8,9,10,1))]"
      />
      {/* Grain */}
      <div className="absolute inset-0 grain pointer-events-none" />

      {/* Top marquee bar */}
      <div className="absolute top-16 md:top-20 left-0 right-0 z-10 border-y border-white/10 bg-black/30 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center h-8 whitespace-nowrap animate-[marquee_60s_linear_infinite]">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8 pr-8 font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/60">
              <Ticker label="LIVE" tone="accent" /> Opportunity workspace
              <Dot /> No résumés
              <Dot /> No interviews
              <Dot /> No gatekeepers
              <Dot /> Just what you can offer today
              <Dot /> Est. 2025
              <Dot /> A movement, not a marketplace
              <Dot />
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 h-full max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-24 md:pb-32"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.9 }}
          className="font-mono-accent text-[11px] md:text-xs uppercase tracking-[0.3em] text-[#E4F222] mb-8 flex items-center gap-3"
        >
          <span className="w-8 h-px bg-[#E4F222]" />
          Ch. 00 — Prologue
        </motion.p>

        <MaskedReveal
          as="h1"
          lines={["Stop looking", "for work."]}
          className="font-display font-medium text-white text-[16vw] md:text-[9.5vw] leading-[0.9] tracking-[-0.04em]"
          delay={0.6}
          stagger={0.1}
        />
        <div className="mt-3 md:mt-4">
          <MaskedReveal
            as="h1"
            lines={["Start creating", <span key="opp" className="italic font-serif-accent text-[#E4F222] font-normal">opportunity.</span>]}
            className="font-display font-medium text-white text-[16vw] md:text-[9.5vw] leading-[0.9] tracking-[-0.04em]"
            delay={0.85}
            stagger={0.1}
          />
        </div>

        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-6 md:gap-8 items-end">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.9 }}
            className="md:col-span-6 font-light text-white/75 text-base md:text-lg leading-relaxed max-w-xl"
          >
            Your skills are worth more than you think. Turn your{" "}
            <span className="text-white">knowledge, tools, equipment, experience, creativity,</span>{" "}
            products and ideas into real income — or find trusted, affordable help from someone who already has exactly what you need.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.9 }}
            className="md:col-span-6 flex flex-col sm:flex-row md:justify-end gap-3 md:gap-4"
          >
            <a
              href="#audiences"
              data-testid="hero-start-earning-btn"
              className="group inline-flex items-center justify-between gap-6 bg-[#E4F222] text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors"
            >
              Start earning today
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
            </a>
            <a
              href="#audiences"
              data-testid="hero-find-help-btn"
              className="group inline-flex items-center justify-between gap-6 bg-transparent text-white border border-white/25 px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:border-[#E4F222] hover:text-[#E4F222] transition-colors"
            >
              Find help today
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
            </a>
          </motion.div>
        </div>

        {/* Bottom meta strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-16 md:mt-20 flex items-end justify-between border-t border-white/10 pt-4 md:pt-6 font-mono-accent text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/50"
        >
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full animate-pulse" />
            Manifesto · v1.0
          </div>
          <a
            href="#problem"
            data-testid="hero-scroll-cue"
            className="hidden md:flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            Scroll to unlock
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
          <div className="hidden md:block">— Est. 2025 · An opportunity workspace</div>
        </motion.div>
      </motion.div>

      {/* Local keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

function Dot() {
  return <span className="w-1 h-1 bg-white/30 rounded-full inline-block" />;
}

function Ticker({ label, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 border ${
        tone === "accent" ? "border-[#E4F222]/40 text-[#E4F222]" : "border-white/20 text-white/70"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tone === "accent" ? "bg-[#E4F222] animate-pulse" : "bg-white/60"}`} />
      {label}
    </span>
  );
}
