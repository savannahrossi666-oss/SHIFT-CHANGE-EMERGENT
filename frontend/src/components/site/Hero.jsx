import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDown, Sparkles } from "lucide-react";

const examples = [
  "I make beats and want to earn $200 this weekend.",
  "I have a truck and four free hours today.",
  "I can tutor algebra for $40 an hour.",
];

export default function Hero() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value) return;
    navigate(`/signup?goal=${encodeURIComponent(value)}`);
  };

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/65" />
      <div className="absolute inset-0 grain pointer-events-none opacity-30" />

      <div className="relative z-10 min-h-[100svh] max-w-[1280px] mx-auto px-6 md:px-10 pt-32 md:pt-36 pb-10 flex flex-col justify-between">
        <div className="max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-mono-accent text-[10px] md:text-xs uppercase tracking-[0.24em] text-white/60 mb-5"
          >
            Earn money with what you already know how to do
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08 }}
            className="font-display font-medium text-white text-[clamp(3rem,7vw,7rem)] leading-[0.92] tracking-[-0.04em] max-w-4xl"
          >
            Stop looking for work. Start creating opportunity.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24 }}
            className="mt-8 max-w-4xl rounded-3xl border border-white/20 bg-black/25 backdrop-blur-2xl p-4 md:p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-white/60 text-[10px] md:text-xs uppercase tracking-[0.2em]">
              <Sparkles className="w-4 h-4" /> Shift AI
            </div>
            <h2 className="mt-4 text-xl md:text-3xl font-medium leading-snug">
              Tell me what you can create or do, and how much you are looking to make.
            </h2>

            <form onSubmit={submit} className="mt-5">
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 focus-within:border-white/35 transition-colors">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Example: I edit videos and want to make $150 today."
                  rows={3}
                  className="w-full resize-none bg-transparent outline-none px-2 py-2 text-base md:text-lg placeholder:text-white/35"
                />
                <div className="mt-2 flex justify-end">
                  <button className="group rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/85 transition-colors">
                    Build my opportunity profile
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.1] hover:text-white transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/45">
          <span>Simple by default. Powerful by choice.</span>
          <a href="#problem" className="hidden md:flex items-center gap-2 hover:text-white transition-colors">
            Learn more <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
