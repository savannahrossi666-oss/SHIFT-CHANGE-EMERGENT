export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[#08090a] border-t border-white/10 px-6 md:px-10 pt-20 pb-10"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 pb-14 border-b border-white/10">
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              <span className="relative w-7 h-7 grid place-items-center shrink-0">
                <span className="absolute inset-0 border border-white/30 rotate-45" />
                <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full" />
              </span>
              <span className="font-brand text-2xl md:text-3xl tracking-normal leading-none text-white">
                SHIFT<span className="text-[#E4F222]"> </span>CHANGE
              </span>
            </div>
            <p className="mt-8 font-display text-2xl md:text-4xl leading-[1.05] tracking-[-0.03em] text-white max-w-xl">
              An opportunity workspace for the people <span className="font-serif-accent italic text-[#E4F222] font-normal">the résumé forgot.</span>
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40 mb-5">
              Workspace
            </p>
            <ul className="space-y-3 font-display text-white/75">
              <li><a href="#audiences" className="hover:text-[#E4F222] transition-colors">Earn</a></li>
              <li><a href="#audiences" className="hover:text-[#E4F222] transition-colors">Hire</a></li>
              <li><a href="#shift" className="hover:text-[#E4F222] transition-colors">The Shift</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40 mb-5">
              Manifesto
            </p>
            <ul className="space-y-3 font-display text-white/75">
              <li><a href="#problem" className="hover:text-[#E4F222] transition-colors">Ch. 01</a></li>
              <li><a href="#manifesto" className="hover:text-[#E4F222] transition-colors">Ch. 04</a></li>
              <li><a href="#transformation" className="hover:text-[#E4F222] transition-colors">Ch. 05</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40 mb-5">
              Signal
            </p>
            <ul className="space-y-3 font-display text-white/75">
              <li><a href="#closing" className="hover:text-[#E4F222] transition-colors">Get updates</a></li>
              <li><a href="#top" className="hover:text-[#E4F222] transition-colors">Back to top</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40">
          <span>© {new Date().getFullYear()} Shift Change · Est. 2025</span>
          <span className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full animate-pulse" />
            Movement · not a marketplace
          </span>
          <span>Made with intent · Not with templates</span>
        </div>

        {/* Signature giant wordmark */}
        <div className="mt-16 md:mt-24 select-none pointer-events-none">
          <div
            className="font-brand text-white/[0.07] leading-none tracking-normal text-center"
            style={{ fontSize: "clamp(4rem, 18vw, 22rem)" }}
            aria-hidden
          >
            SHIFT CHANGE
          </div>
        </div>
      </div>
    </footer>
  );
}
