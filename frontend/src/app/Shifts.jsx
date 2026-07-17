import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { ShiftCard } from "./Dashboard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowUpRight, Filter, Loader2, Plus, X, MapPin, DollarSign } from "lucide-react";

const KINDS = [
  { key: "service", label: "Service" },
  { key: "gig", label: "Gig" },
  { key: "consultation", label: "Consultation" },
  { key: "rental", label: "Rental" },
  { key: "product", label: "Product" },
  { key: "custom", label: "Custom request" },
];

// -------------- BROWSE (list) --------------
export function ShiftsList({ mine = false }) {
  const [params] = useSearchParams();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [kind, setKind] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const p = {};
    if (mine) p.mine = true;
    if (q) p.q = q;
    if (kind) p.kind = kind;
    try { setItems(await api.listShifts(p)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [mine, kind]);
  useEffect(() => { setQ(initialQ); }, [initialQ]);

  const submit = (e) => { e.preventDefault(); load(); };

  return (
    <AppShell>
      <PageHeader
        chapter={mine ? "Your shifts" : "Browse the workspace"}
        title={mine ? "Everything you've posted or accepted." : "What can you take on today?"}
        subtitle={mine ? "Filter, review, and jump into workspaces." : "Live shifts from earners and seekers across the workspace."}
        actions={
          <Link to="/shifts/new" data-testid="shifts-list-create" className="group flex items-center gap-3 bg-[#E4F222] text-[#08090a] px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Create
          </Link>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        <form onSubmit={submit} className="flex flex-wrap gap-2 items-center">
          <input data-testid="shifts-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, tag, description…" className="flex-1 min-w-[200px] bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3 text-sm" />
          <div className="flex flex-wrap gap-2">
            <FilterChip label="All" active={!kind} onClick={() => setKind("")} />
            {KINDS.map((k) => <FilterChip key={k.key} label={k.label} active={kind === k.key} onClick={() => setKind(k.key)} />)}
          </div>
        </form>

        {loading ? (
          <div className="py-20 text-center text-white/40"><Loader2 className="w-5 h-5 mx-auto animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center">
            <p className="text-white/50">No shifts found.</p>
            <Link to="/shifts/new" className="mt-4 inline-block text-[#E4F222] font-mono-accent text-[10px] uppercase tracking-[0.25em] hover:underline">Post the first one →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => <ShiftCard key={s.shift_id} s={s} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 border font-mono-accent text-[10px] uppercase tracking-[0.22em] transition-colors ${active ? "border-[#E4F222] text-[#E4F222] bg-[#E4F222]/[0.05]" : "border-white/15 text-white/60 hover:text-white hover:border-white/30"}`}>{label}</button>
  );
}

// -------------- CREATE --------------
export function CreateShift() {
  const nav = useNavigate();
  const [form, setForm] = useState({ kind: "service", title: "", description: "", price: "", currency: "USD", tags: [], location: "", delivery: "remote" });
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await api.createShift({ ...form, price: parseFloat(form.price || 0) });
      nav(`/shifts/${r.shift_id}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <PageHeader chapter="Create a Shift" title="Post an opportunity." subtitle="Services, gigs, consultations, rentals, products, or a custom request — you decide the shape." />
      <form onSubmit={submit} className="px-6 md:px-10 py-10 max-w-3xl space-y-8">
        <div>
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-3">Shift type</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {KINDS.map((k) => (
              <button key={k.key} type="button" data-testid={`kind-${k.key}`} onClick={() => setForm({ ...form, kind: k.key })} className={`p-4 border transition-colors text-left ${form.kind === k.key ? "border-[#E4F222] bg-[#E4F222]/[0.05]" : "border-white/15 hover:border-white/30"}`}>
                <span className="font-display text-lg">{k.label}</span>
              </button>
            ))}
          </div>
        </div>

        <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} testId="shift-title" required />
        <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} testId="shift-desc" />

        <div className="grid md:grid-cols-3 gap-4">
          <TextField label="Price (USD)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" testId="shift-price" required />
          <TextField label="Location (optional)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} testId="shift-location" />
          <div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Delivery</div>
            <div className="flex gap-2">
              {["remote", "onsite"].map(x => <FilterChip key={x} label={x} active={form.delivery === x} onClick={() => setForm({ ...form, delivery: x })} />)}
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Tags</div>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
            {form.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-2 border border-white/15 px-3 py-1.5 text-sm">{t}
                <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, k) => k !== i) })} className="text-white/40 hover:text-[#FF3B30]"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (tag.trim()) { setForm({ ...form, tags: [...form.tags, tag.trim()] }); setTag(""); } } }} placeholder="e.g. photography, delivery, react" className="flex-1 bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-3 py-2 text-sm" />
          </div>
        </div>

        {err && <p className="text-[#FF3B30] font-mono-accent">{err}</p>}

        <div className="flex gap-3">
          <button data-testid="submit-shift" disabled={busy} className="group flex items-center gap-4 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Post shift <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" /></>}
          </button>
          <button type="button" onClick={() => nav(-1)} className="border border-white/15 hover:border-white/30 px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em]">Cancel</button>
        </div>
      </form>
    </AppShell>
  );
}

function TextField({ label, value, onChange, type = "text", testId, required }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <input data-testid={testId} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3" />
    </label>
  );
}
function TextArea({ label, value, onChange, testId }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <textarea data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3 resize-y" />
    </label>
  );
}

// -------------- DETAIL --------------
export function ShiftDetail() {
  const { shiftId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => { try { setS(await api.getShift(shiftId)); } catch {} })();
  }, [shiftId]);

  const doAction = async (action) => {
    setBusy(true);
    try {
      const r = await api.actionShift(shiftId, action);
      setS(r);
      if (action === "accept" && r.workspace_id) nav(`/workspace/${r.workspace_id}`);
    } finally { setBusy(false); }
  };

  if (!s) return <AppShell><div className="p-10 text-white/50">Loading…</div></AppShell>;
  const isOwner = user?.user_id === s.owner_id;
  const isAccepter = user?.user_id === s.accepted_by;

  return (
    <AppShell>
      <PageHeader chapter={`Shift · ${s.kind}`} title={s.title} subtitle={`Posted by ${s.owner_name}`} />
      <div className="px-6 md:px-10 py-10 grid lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{s.kind}</Badge>
            <Badge tone={s.status === "open" ? "muted" : s.status === "completed" ? "accent" : "muted"}>{s.status}</Badge>
            {s.delivery && <Badge>{s.delivery}</Badge>}
            {s.location && <Badge><MapPin className="w-3 h-3 inline mr-1" />{s.location}</Badge>}
          </div>
          <div className="border border-white/10 p-6">
            <p className="text-white/80 whitespace-pre-wrap">{s.description}</p>
            {s.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {s.tags.map((t, i) => <span key={i} className="border border-white/15 px-2.5 py-1 text-xs font-mono-accent uppercase tracking-[0.2em] text-white/60">{t}</span>)}
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="border border-white/10 p-6">
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Price</div>
            <div className="font-display text-4xl text-[#E4F222]"><DollarSign className="w-6 h-6 inline -mt-1" />{s.price} <span className="text-sm text-white/40">{s.currency}</span></div>
          </div>
          <div className="border border-white/10 p-6">
            <Link to={`/u/${s.owner_id}`} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center overflow-hidden">
                <span className="font-brand text-sm">{s.owner_name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <div className="text-sm">{s.owner_name}</div>
                <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-[#E4F222]">{s.owner_role}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 ml-auto text-white/40 group-hover:text-[#E4F222] group-hover:rotate-45 transition-all" />
            </Link>
          </div>

          {/* Actions */}
          <div className="border border-white/10 p-6 space-y-3">
            {!isOwner && !isAccepter && s.status === "open" && (
              <button data-testid="accept-shift" onClick={() => doAction("accept")} disabled={busy} className="w-full bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-4 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">Accept & Open Workspace</button>
            )}
            {(isOwner || isAccepter) && s.workspace_id && (
              <Link to={`/workspace/${s.workspace_id}`} className="block text-center border border-[#E4F222]/40 hover:border-[#E4F222] text-[#E4F222] px-4 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em]">Open workspace</Link>
            )}
            {(isOwner || isAccepter) && s.status !== "completed" && s.status !== "cancelled" && s.workspace_id && (
              <button data-testid="complete-shift" onClick={() => doAction("complete")} disabled={busy} className="w-full border border-white/15 hover:border-[#E4F222] hover:text-[#E4F222] px-4 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em]">Mark complete</button>
            )}
            {isOwner && s.status === "open" && (
              <button onClick={() => doAction("cancel")} disabled={busy} className="w-full border border-white/15 hover:border-[#FF3B30]/60 hover:text-[#FF3B30] px-4 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em]">Cancel shift</button>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Badge({ children, tone }) {
  return <span className={`px-2.5 py-1 border font-mono-accent text-[10px] uppercase tracking-[0.22em] ${tone === "accent" ? "border-[#E4F222]/50 text-[#E4F222]" : "border-white/15 text-white/70"}`}>{children}</span>;
}
