import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

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
    navigate(value ? `/signup?goal=${encodeURIComponent(value)}` : "/signup");
  };

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center px-5 pt-24 pb-8"
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 grain pointer-events-none opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-4xl text-center"
      >
        <p className="font-mono-accent text-[10px] md:text-xs uppercase tracking-[0.24em] text-white/60">
          Earn money with what you already know how to do
        </p>

        <h1 className="font-display font-medium text-white text-[clamp(2.8rem,7vw,6.7rem)] leading-[0.95] tracking-[-0.04em] mt-5">
          Stop looking for work.
          <span className="block mt-2">Start creating opportunity.</span>
        </h1>

        <div className="mt-7 md:mt-9 rounded-3xl border border-white/20 bg-black/25 backdrop-blur-2xl p-4 md:p-6 shadow-2xl text-left">
          <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] md:text-xs uppercase tracking-[0.2em]">
            <Sparkles className="w-4 h-4" /> Shift AI
          </div>

          <h2 className="mt-4 text-center text-xl md:text-3xl font-medium leading-snug max-w-3xl mx-auto">
            Tell me what you can create or do, and how much you are looking to make.
          </h2>

          <form onSubmit={submit} className="mt-5">
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-3 focus-within:border-white/35 transition-colors">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: I edit videos and want to make $150 today."
                rows={2}
                className="w-full resize-none bg-transparent outline-none px-2 py-2 text-center text-base md:text-lg placeholder:text-white/35"
              />
              <div className="mt-2 flex justify-center">
                <button className="group rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/85 transition-colors">
                  Build my opportunity profile
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
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
        </div>

        <p className="mt-5 text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/45">
          Simple by default. Powerful by choice.
        </p>
      </motion.div>
    </section>
  );
}
