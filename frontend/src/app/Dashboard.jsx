import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowUpRight, Briefcase, MessageSquare, Search, Sparkles, Wallet } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [ws, setWs] = useState([]);
  const [recs, setRecs] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    (async () => {
      try { setWs(await api.myWorkspaces()); } catch {}
      try { setRecs(await api.recommendations()); } catch {}
      try { setWallet(await api.wallet()); } catch {}
    })();
  }, []);

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || "there";
  const activeWorkspace = ws.find((item) => item.payment_status !== "released") || ws[0];

  const submitPrompt = (event) => {
    event.preventDefault();
    const goal = prompt.trim();
    if (!goal) return;
    navigate(`/shifts?q=${encodeURIComponent(goal)}&intent=opportunity`);
  };

  return (
    <AppShell>
      <div className="px-6 md:px-10 py-10 md:py-16 max-w-6xl mx-auto w-full">
        <section className="rounded-3xl border border-white/15 bg-black/25 backdrop-blur-2xl p-6 md:p-10 shadow-2xl">
          <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-[0.18em]">
            <Sparkles className="w-4 h-4" /> Shift AI
          </div>
          <p className="mt-6 text-white/60 text-sm md:text-base">Welcome back, {firstName}.</p>
          <h1 className="font-display text-3xl md:text-5xl leading-tight mt-2 max-w-4xl">
            Tell me what you can create or do, and how much you are looking to make.
          </h1>

          <form onSubmit={submitPrompt} className="mt-8">
            <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3 focus-within:border-white/35 transition-colors">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: I make beats in FL Studio and want to earn $200 this weekend."
                rows={3}
                className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-base md:text-lg placeholder:text-white/35"
              />
              <button className="md:self-end rounded-xl bg-white text-black px-5 py-3 font-semibold flex items-center justify-center gap-2 hover:bg-white/85 transition-colors">
                Find opportunities <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/55">
            {["I have a truck and four free hours", "I edit videos and want recurring clients", "I can tutor algebra for $40 an hour"].map((example) => (
              <button key={example} onClick={() => setPrompt(example)} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 hover:bg-white/[0.09] hover:text-white transition-colors">
                {example}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 grid md:grid-cols-3 gap-4">
          <QuickCard
            icon={activeWorkspace ? Briefcase : Search}
            title={activeWorkspace ? "Continue working" : "Find an opportunity"}
            text={activeWorkspace ? activeWorkspace.shift_title : `${recs.length} opportunities currently match your profile.`}
            to={activeWorkspace ? `/workspace/${activeWorkspace.workspace_id}` : "/shifts"}
          />
          <QuickCard
            icon={MessageSquare}
            title="Messages"
            text="Open your workspaces to continue conversations and share files."
            to="/workspaces"
          />
          <QuickCard
            icon={Wallet}
            title="Earnings"
            text={wallet ? `$${wallet.balance.toFixed(2)} available in your wallet.` : "View your earnings and payment activity."}
            to="/wallet"
          />
        </section>

        <section className="mt-8 rounded-3xl border border-white/12 bg-black/20 backdrop-blur-xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Your workspace</p>
              <h2 className="font-display text-2xl md:text-3xl mt-2">Simple by default. Yours when you customize it.</h2>
              <p className="mt-2 text-white/55 max-w-2xl">Pin your favorite tools, hide what you do not use, and arrange your profile and workspace around the way you actually work.</p>
            </div>
            <Link to="/profile" className="shrink-0 rounded-xl border border-white/20 px-4 py-3 text-sm hover:bg-white/10 transition-colors">Customize</Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function QuickCard({ icon: Icon, title, text, to }) {
  return (
    <Link to={to} className="group rounded-2xl border border-white/12 bg-black/20 backdrop-blur-xl p-5 hover:bg-white/[0.08] hover:border-white/25 transition-all">
      <div className="flex items-start justify-between gap-4">
        <span className="w-10 h-10 rounded-xl border border-white/15 bg-white/[0.06] grid place-items-center"><Icon className="w-5 h-5" /></span>
        <ArrowUpRight className="w-4 h-4 text-white/35 group-hover:text-white group-hover:rotate-45 transition-all" />
      </div>
      <h2 className="font-display text-xl mt-6">{title}</h2>
      <p className="text-white/50 text-sm mt-2 leading-relaxed">{text}</p>
    </Link>
  );
}
