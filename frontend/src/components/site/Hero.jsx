import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

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
      className="relative h-[100svh] w-full overflow-hidden flex items-center justify-center px-5 pt-20 pb-5"
    >
      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 grain pointer-events-none opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center justify-center"
      >
        <h1 className="font-display uppercase text-white text-[clamp(2.5rem,6.2vw,5.7rem)] leading-[0.94] tracking-[0.035em] max-w-4xl">
          Why look for work when you can create opportunities that pay?
        </h1>

        <form onSubmit={submit} className="mt-6 w-full max-w-3xl">
          <div className="rounded-2xl border border-white/20 bg-black/30 backdrop-blur-xl p-3 md:p-4 shadow-2xl">
            <div className="flex items-center justify-center gap-2 text-white/60 text-[10px] uppercase tracking-[0.18em]">
              <Sparkles className="w-3.5 h-3.5" /> Shift AI
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Tell me what you can create or do, and how much you want to make."
              rows={2}
              className="mt-3 w-full resize-none bg-transparent outline-none px-3 py-2 text-center text-base md:text-lg leading-snug placeholder:text-white/40"
            />

            <div className="mt-2 flex justify-center">
              <button className="group rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/85 transition-colors">
                Build my opportunity profile
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </section>
  );
}
