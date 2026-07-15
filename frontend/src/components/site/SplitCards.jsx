import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Rise } from "./MaskedReveal";
import { ArrowUpRight } from "lucide-react";

const EARN_ITEMS = [
  "Photography",
  "Music",
  "Tutoring",
  "Graphic Design",
  "AI Data Collection",
  "Moving",
  "Lawn Care",
  "Pet Sitting",
  "Pressure Washing",
  "Programming",
  "Video Editing",
  "Selling Equipment",
  "Custom Products",
  "Cleaning",
  "Handyman Services",
  "Driving",
  "Creative Writing",
  "Voice Acting",
  "Drone Photography",
  "Anything valuable.",
];

const NEED_ITEMS = [
  "Need a website?",
  "Need furniture moved?",
  "Need a tutor?",
  "Need your dog walked?",
  "Need your lawn mowed?",
  "Need a photographer?",
  "Need a logo?",
  "Need help assembling furniture?",
  "Need a ride?",
  "Need someone to edit videos?",
  "Need AI data recorded?",
  "Need custom products?",
  "Need everyday help without paying expensive companies?",
];

function Spotlight({ children, image, testId }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: -200, y: -200, visible: false });

  const onMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  return (
    <div
      ref={ref}
      data-testid={testId}
      onMouseMove={onMove}
      onMouseLeave={() => setPos((p) => ({ ...p, visible: false }))}
      className="group relative overflow-hidden bg-[#0b0c0d] transition-colors duration-500"
    >
      {/* Photograph — clipped, spotlighted */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.22] transition-opacity duration-1000 grayscale contrast-125 bg-cover bg-center"
        style={{ backgroundImage: `url('${image}')`, clipPath: "polygon(0 12%, 100% 0, 100% 88%, 0 100%)" }}
      />

      {/* Mouse-following spotlight */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500"
        style={{
          opacity: pos.visible ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, rgba(228,242,34,0.14), transparent 60%)`,
        }}
      />

      {/* Grain */}
      <div className="absolute inset-0 grain pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function SplitCards() {
  return (
    <section
      id="audiences"
      data-testid="audiences-section"
      className="relative bg-[#08090a] border-y border-white/10"
    >
      <Rise>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-16 md:py-24 flex items-end justify-between">
          <div>
            <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
              Ch. 03 — Two sides, one workspace
            </p>
            <h2 className="mt-4 font-display font-medium text-white text-4xl md:text-6xl leading-[1.02] tracking-[-0.03em] max-w-3xl">
              Pick your side. <span className="text-white/50">Or use both.</span>
            </h2>
          </div>
          <div className="hidden md:block font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40 text-right leading-relaxed">
            Hover to reveal<br />
            <span className="text-white/70">↘ interactive spotlight</span>
          </div>
        </div>
      </Rise>

      <div className="grid grid-cols-1 md:grid-cols-2 border-t border-white/10">
        {/* LEFT: I WANT TO EARN */}
        <Spotlight
          testId="earn-card"
          image="https://images.unsplash.com/photo-1615754890634-69ac8bca7189?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxjcmVhdGl2ZSUyMHBlcnNvbiUyMHNwb3RsaWdodCUyMGRhcmt8ZW58MHx8fHwxNzg0MDgxMjAzfDA&ixlib=rb-4.1.0&q=85"
        >
          <div className="px-6 md:px-12 py-16 md:py-24 md:min-h-[720px] flex flex-col md:border-r md:border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/40">
                / 01
              </span>
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
                Earn
              </span>
            </div>

            <h3 className="mt-10 font-display font-medium text-white text-6xl md:text-8xl leading-[0.9] tracking-[-0.04em]">
              I want<br />to <span className="font-serif-accent italic text-[#E4F222] font-normal">earn.</span>
            </h3>

            <ul className="mt-14 columns-2 gap-x-8 space-y-1.5 md:space-y-2">
              {EARN_ITEMS.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.02 * i, duration: 0.6 }}
                  className={`group/li flex items-center gap-3 font-display text-lg md:text-xl tracking-tight break-inside-avoid ${
                    item === "Anything valuable." ? "text-[#E4F222] italic font-serif-accent text-2xl md:text-3xl" : "text-white/80 hover:text-white"
                  } transition-colors cursor-default`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${
                      item === "Anything valuable." ? "bg-[#E4F222]" : "bg-white/30 group-hover/li:bg-[#E4F222]"
                    } transition-colors`}
                  />
                  {item}
                </motion.li>
              ))}
            </ul>

            <div className="mt-auto pt-16">
              <p className="text-white/60 font-light text-base md:text-lg leading-relaxed max-w-md">
                Turn what you already <span className="text-white">know, own, or can do</span> into income.
              </p>
              <a
                href="#closing"
                data-testid="earn-cta"
                className="group mt-8 inline-flex items-center gap-4 border border-white/20 hover:border-[#E4F222] hover:text-[#E4F222] transition-colors px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] text-white"
              >
                Start earning
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              </a>
            </div>
          </div>
        </Spotlight>

        {/* RIGHT: I NEED HELP */}
        <Spotlight
          testId="help-card"
          image="https://images.unsplash.com/photo-1777861845890-19fcc843e33a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w8NjY2NjV8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwdG9vbHMlMjBkYXJrfGVufDB8fHx8MTc4NDA4MTIwM3ww&ixlib=rb-4.1.0&q=85"
        >
          <div className="px-6 md:px-12 py-16 md:py-24 md:min-h-[720px] flex flex-col bg-[#101112]/60">
            <div className="flex items-center justify-between">
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-white/40">
                / 02
              </span>
              <span className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222]">
                Hire
              </span>
            </div>

            <h3 className="mt-10 font-display font-medium text-white text-6xl md:text-8xl leading-[0.9] tracking-[-0.04em]">
              I need<br /><span className="font-serif-accent italic text-[#E4F222] font-normal">help.</span>
            </h3>

            <ul className="mt-14 space-y-3">
              {NEED_ITEMS.map((q, i) => (
                <motion.li
                  key={q}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.03 * i, duration: 0.5 }}
                  className="group/li flex items-center gap-4 border-b border-white/10 py-2 hover:border-[#E4F222]/40 transition-colors"
                >
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/30 w-8">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-lg md:text-2xl tracking-tight text-white/85 group-hover/li:text-white flex-1">
                    {q}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-white/20 group-hover/li:text-[#E4F222] group-hover/li:-translate-y-0.5 transition-all" />
                </motion.li>
              ))}
            </ul>

            <div className="mt-auto pt-16">
              <p className="text-white/60 font-light text-base md:text-lg leading-relaxed max-w-md">
                Find <span className="text-white">trusted people</span> in one workspace — without hopping across half a dozen apps.
              </p>
              <a
                href="#closing"
                data-testid="help-cta"
                className="group mt-8 inline-flex items-center gap-4 bg-white text-[#08090a] hover:bg-[#E4F222] transition-colors px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold"
              >
                Find someone today
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform" />
              </a>
            </div>
          </div>
        </Spotlight>
      </div>
    </section>
  );
}
