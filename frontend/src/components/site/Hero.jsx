import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
      <div className="absolute inset-0 grain pointer-events-none opacity-40" />

      <div className="relative z-10 min-h-[100svh] max-w-[1440px] mx-auto px-6 md:px-10 pt-32 md:pt-36 pb-10 flex flex-col justify-between">
        <div className="max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-mono-accent text-[10px] md:text-xs uppercase tracking-[0.28em] text-white/65 mb-6"
          >
            Turn what you can do into income
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display font-medium text-white text-[clamp(3.4rem,8vw,8.5rem)] leading-[0.9] tracking-[-0.045em]"
          >
            Stop looking for work.
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="font-display font-medium text-white text-[clamp(3.1rem,7vw,7.5rem)] leading-[0.95] tracking-[-0.04em] mt-3"
          >
            Start creating opportunity.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.36 }}
            className="mt-8 max-w-2xl text-white/75 text-base md:text-lg leading-relaxed"
          >
            Tell Shift Change what you can create or do and how much you want to make. It helps turn the skills, tools, and experience you already have into real opportunities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.48 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <a
              href="/signup"
              data-testid="hero-start-earning-btn"
              className="group inline-flex items-center justify-between gap-6 rounded-xl bg-white text-black px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.18em] font-semibold hover:bg-white/85 transition-colors"
            >
              Build your opportunity profile
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
            <a
              href="/login"
              data-testid="hero-find-help-btn"
              className="group inline-flex items-center justify-between gap-6 rounded-xl bg-black/20 text-white border border-white/25 backdrop-blur-md px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.18em] font-semibold hover:bg-white/10 transition-colors"
            >
              Sign in
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </a>
          </motion.div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] md:text-xs uppercase tracking-[0.22em] text-white/45">
          <span>Simple by default. Powerful by choice.</span>
          <a href="#problem" className="hidden md:flex items-center gap-2 hover:text-white transition-colors">
            Learn more <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
