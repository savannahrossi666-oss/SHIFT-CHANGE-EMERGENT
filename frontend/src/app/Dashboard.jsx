import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowUpRight, Plus, Star, Sparkles, Briefcase, TrendingUp } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [ws, setWs] = useState([]);
  const [recs, setRecs] = useState([]);
  const [mine, setMine] = useState([]);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    (async () => {
      try { setWs(await api.myWorkspaces()); } catch {}
      try { setRecs(await api.recommendations()); } catch {}
      try { setMine(await api.listShifts({ mine: true })); } catch {}
      try { setWallet(await api.wallet()); } catch {}
    })();
  }, []);

  if (!user) return null;
  const isEarner = user.role === "earner" || user.role === "both";
  const isSeeker = user.role === "seeker" || user.role === "both";

  return (
    <AppShell>
      <PageHeader
        chapter={`Welcome back, ${user.name.split(" ")[0]}`}
        title={isEarner ? "What can you offer today?" : "What do you need done today?"}
        subtitle={isEarner
          ? "Your skills, tools, hours and ideas are ready to become income. Post a shift or accept one below."
          : "Your workspace is warm. Post what you need, or pick from trusted people below."}
        actions={
          <Link to="/shifts/new" data-testid="dashboard-create-shift" className="group flex items-center gap-3 bg-[#E4F222] text-[#08090a] px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create a Shift
          </Link>
        }
      />

      <div className="px-6 md:px-10 py-10 space-y-14">
        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={Briefcase} label="Active workspaces" value={ws.filter((w) => w.payment_status !== "released").length} />
          <Stat icon={Sparkles} label="Open shifts" value={mine.filter((s) => s.status === "open").length} />
          <Stat icon={Star} label="Rating" value={user.rating ? user.rating.toFixed(2) : "—"} sub={`${user.review_count || 0} reviews`} />
          <Stat icon={TrendingUp} label="Wallet" value={wallet ? `$${wallet.balance.toFixed(2)}` : "—"} sub="MOCKED" />
        </div>

        {/* Workspaces */}
        <Section title="Your workspaces" subtitle="Every accepted shift lives here." link="/workspaces">
          {ws.length === 0 ? (
            <Empty text="No workspaces yet — accept a shift to spin one up." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ws.slice(0, 6).map((w) => (
                <Link key={w.workspace_id} to={`/workspace/${w.workspace_id}`} data-testid={`ws-${w.workspace_id}`} className="group border border-white/10 hover:border-[#E4F222] transition-colors p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">Workspace</span>
                    <span className={`font-mono-accent text-[10px] uppercase tracking-[0.25em] ${w.payment_status === "paid" ? "text-[#E4F222]" : "text-white/40"}`}>{w.payment_status}</span>
                  </div>
                  <h3 className="font-display text-xl leading-tight tracking-tight">{w.shift_title}</h3>
                  <div className="mt-6 flex items-center justify-between font-mono-accent text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <span>{w.tasks?.length || 0} tasks</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 group-hover:text-[#E4F222] transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Recommendations */}
        <Section title={isEarner ? "Shifts that match you" : "Recommended talent & shifts"} subtitle="Curated from the live workspace." link="/shifts">
          {recs.length === 0 ? (
            <Empty text="Nothing matched yet — try posting a shift or updating your profile skills." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recs.slice(0, 6).map((s) => <ShiftCard key={s.shift_id} s={s} />)}
            </div>
          )}
        </Section>

        {/* Your shifts */}
        <Section title="Your shifts" subtitle="Posts you own or have accepted." link="/shifts/mine">
          {mine.length === 0 ? (
            <Empty text="You haven't posted any shifts yet." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mine.slice(0, 6).map((s) => <ShiftCard key={s.shift_id} s={s} />)}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="border border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</span>
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div className="font-display text-3xl md:text-4xl tracking-tight">{value}</div>
      {sub && <div className="mt-1 font-mono-accent text-[10px] uppercase tracking-[0.2em] text-white/30">{sub}</div>}
    </div>
  );
}

function Section({ title, subtitle, link, children }) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display font-medium text-2xl md:text-3xl tracking-tight">{title}</h2>
          {subtitle && <p className="mt-1 text-white/50 text-sm">{subtitle}</p>}
        </div>
        {link && <Link to={link} className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-[#E4F222] transition-colors flex items-center gap-2">See all <ArrowUpRight className="w-3 h-3" /></Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className="border border-dashed border-white/10 p-10 text-center">
      <p className="text-white/40 font-light">{text}</p>
    </div>
  );
}

export function ShiftCard({ s }) {
  return (
    <Link to={`/shifts/${s.shift_id}`} data-testid={`shift-${s.shift_id}`} className="group border border-white/10 hover:border-[#E4F222] transition-colors p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">{s.kind}</span>
        <span className={`font-mono-accent text-[10px] uppercase tracking-[0.25em] ${s.status === "open" ? "text-white/60" : s.status === "completed" ? "text-[#E4F222]" : "text-white/40"}`}>{s.status}</span>
      </div>
      <h3 className="font-display text-xl leading-tight tracking-tight line-clamp-2">{s.title}</h3>
      <p className="mt-2 text-white/50 text-sm font-light line-clamp-2 flex-1">{s.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg text-[#E4F222]">${s.price}<span className="font-mono-accent text-[10px] uppercase tracking-[0.2em] text-white/40 ml-1">{s.currency}</span></span>
        <span className="text-white/40 text-xs">by {s.owner_name}</span>
      </div>
    </Link>
  );
}
