import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      data-testid="site-nav"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "bg-[#08090a]/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 md:px-10 h-16 md:h-20">
        <a
          href="#top"
          data-testid="nav-logo"
          className="flex items-center gap-2 group"
        >
          <span className="relative w-6 h-6 grid place-items-center">
            <span className="absolute inset-0 border border-white/30 rotate-45 group-hover:rotate-[135deg] transition-transform duration-700" />
            <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full" />
          </span>
          <span className="font-display text-lg tracking-tight">
            Shift<span className="text-[#E4F222]">·</span>Change
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-10 font-mono-accent text-[11px] uppercase tracking-[0.22em] text-white/60">
          <a href="#problem" className="hover:text-white transition-colors">
            01 · Problem
          </a>
          <a href="#shift" className="hover:text-white transition-colors">
            02 · The Shift
          </a>
          <a href="#audiences" className="hover:text-white transition-colors">
            03 · Workspace
          </a>
          <a href="#manifesto" className="hover:text-white transition-colors">
            04 · Manifesto
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#audiences"
            data-testid="nav-find-help-link"
            className="hidden sm:inline-block font-mono-accent text-[11px] uppercase tracking-[0.22em] text-white/70 hover:text-white transition-colors"
          >
            Find Help
          </a>
          <a
            href="#audiences"
            data-testid="nav-start-earning-btn"
            className="group relative inline-flex items-center gap-2 bg-[#E4F222] text-[#08090a] px-4 md:px-5 py-2.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors"
          >
            Start Earning
            <span className="w-1.5 h-1.5 bg-[#08090a] group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </motion.header>
  );
}
