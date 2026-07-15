import { useEffect } from "react";
import Lenis from "lenis";

export default function useLenis() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Handle anchor scroll manually via Lenis for smoothness
    const handleAnchor = (e) => {
      const anchor = e.target.closest("a[href^='#']");
      if (!anchor) return;
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -80, duration: 1.6 });
    };
    document.addEventListener("click", handleAnchor);

    // Also expose a global for CTA buttons
    window.__lenis = lenis;

    return () => {
      document.removeEventListener("click", handleAnchor);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
}
