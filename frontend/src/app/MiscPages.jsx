import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { api } from "@/lib/api";
import { Bell, DollarSign, Info } from "lucide-react";

export function Notifications() {
  const [items, setItems] = useState([]);
  const load = async () => { try { setItems(await api.notifications()); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => { api.markRead().catch(() => {}); }, []);
  return (
    <AppShell>
      <PageHeader chapter="Signal" title="Notifications." subtitle="Every event that touches your workspaces." />
      <div className="px-6 md:px-10 py-8 max-w-3xl">
        {items.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center text-white/40">No notifications yet.</div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Link key={n.notif_id} to={n.link || "#"} data-testid={`notif-${n.notif_id}`} className="flex items-start gap-4 border border-white/10 hover:border-[#E4F222] transition-colors p-4">
                <div className={`w-8 h-8 grid place-items-center border ${n.read ? "border-white/10" : "border-[#E4F222]/60 bg-[#E4F222]/[0.06]"}`}>
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/85 text-sm">{n.text}</div>
                  <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">{new Date(n.ts).toLocaleString()}</div>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#E4F222] mt-2" />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function WalletPage() {
  const [w, setW] = useState(null);
  useEffect(() => { (async () => { try { setW(await api.wallet()); } catch {} })(); }, []);
  return (
    <AppShell>
      <PageHeader chapter="Wallet" title="Earnings & payouts." subtitle="MOCKED balance for the prototype. Stripe integration is a follow-up." />
      <div className="px-6 md:px-10 py-8 max-w-3xl space-y-6">
        <div className="border border-[#E4F222]/30 bg-[#E4F222]/[0.04] p-6">
          <div className="flex items-center gap-2 text-[#E4F222] font-mono-accent text-[10px] uppercase tracking-[0.25em] mb-3">
            <Info className="w-3.5 h-3.5" /> Beta wallet · Stripe pending
          </div>
          <div className="font-display text-6xl tracking-tight"><DollarSign className="w-8 h-8 inline -mt-3" />{(w?.balance ?? 0).toFixed(2)}</div>
          <div className="mt-2 font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">{w?.currency || "USD"}</div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-white/10 p-5"><div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Completed shifts</div><div className="font-display text-3xl">{w?.completed_shifts ?? 0}</div></div>
          <div className="border border-white/10 p-5"><div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">In progress</div><div className="font-display text-3xl">{w?.pending_shifts ?? 0}</div></div>
        </div>
        <p className="text-white/50 text-sm">Payouts, cards, and instant transfer will unlock once Stripe is wired.</p>
      </div>
    </AppShell>
  );
}
