import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Star, Check, Loader2, Plus, X } from "lucide-react";

const CHIP_LISTS = [
  { key: "skills", label: "Skills" },
  { key: "services", label: "Services" },
  { key: "products", label: "Products" },
  { key: "equipment", label: "Equipment" },
];

export function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(user);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) setForm(user); }, [user]);
  if (!user || !form) return null;

  const addChip = (key, val) => {
    if (!val) return;
    setForm({ ...form, [key]: [...(form[key] || []), val] });
  };
  const removeChip = (key, i) => {
    const arr = [...(form[key] || [])]; arr.splice(i, 1);
    setForm({ ...form, [key]: arr });
  };

  const save = async () => {
    setBusy(true); setSaved(false);
    try {
      const payload = { name: form.name, bio: form.bio, photo: form.photo, location: form.location };
      CHIP_LISTS.forEach((c) => (payload[c.key] = form[c.key] || []));
      const u = await api.updateProfile(payload);
      setUser(u); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setBusy(false); }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, photo: reader.result });
    reader.readAsDataURL(f);
  };

  return (
    <AppShell>
      <PageHeader
        chapter="Your profile"
        title="One reputation. One profile. One you."
        subtitle="Everything below shows on your public workspace card and shift replies."
        actions={
          <button data-testid="profile-save" onClick={save} disabled={busy} className="group flex items-center gap-3 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save profile"}
          </button>
        }
      />

      <div className="px-6 md:px-10 py-10 grid lg:grid-cols-[320px_1fr] gap-10">
        {/* Left: identity */}
        <div className="space-y-6">
          <label className="block group cursor-pointer">
            <div className="w-full aspect-square border border-white/10 hover:border-[#E4F222] transition-colors bg-white/[0.03] grid place-items-center overflow-hidden relative">
              {form.photo ? <img src={form.photo} alt="" className="w-full h-full object-cover" /> :
                <div className="text-center px-4">
                  <div className="font-brand text-4xl mb-3">{(form.name || "?")[0]?.toUpperCase()}</div>
                  <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">Click to upload photo</div>
                </div>}
              <input data-testid="profile-photo" type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </div>
          </label>

          <div className="border border-white/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#E4F222]" />
              <span className="font-display text-xl">{user.rating ? user.rating.toFixed(2) : "—"}</span>
              <span className="text-white/40 text-xs">/ 5 · {user.review_count || 0} reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${user.verified ? "bg-[#E4F222]" : "bg-white/30"}`} />
              <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/60">{user.verified ? "Verified" : "Unverified"}</span>
            </div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">Role: <span className="text-[#E4F222]">{user.role}</span></div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">ID: <span className="text-white/70">{user.user_id}</span></div>
          </div>
        </div>

        {/* Right: content */}
        <div className="space-y-8">
          <TextField label="Display name" value={form.name || ""} onChange={(v) => setForm({ ...form, name: v })} testId="profile-name" />
          <TextField label="Location" value={form.location || ""} onChange={(v) => setForm({ ...form, location: v })} placeholder="City, State (optional)" testId="profile-location" />
          <TextArea label="Bio" value={form.bio || ""} onChange={(v) => setForm({ ...form, bio: v })} placeholder="Two lines about what you do and how you help people." testId="profile-bio" />

          <div className="grid md:grid-cols-2 gap-6">
            {CHIP_LISTS.map((c) => (
              <ChipEditor key={c.key} label={c.label} items={form[c.key] || []} onAdd={(v) => addChip(c.key, v)} onRemove={(i) => removeChip(c.key, i)} testId={`chips-${c.key}`} />
            ))}
          </div>

          <PortfolioEditor items={form.portfolio || []} onChange={(portfolio) => setForm({ ...form, portfolio })} />
        </div>
      </div>
    </AppShell>
  );
}

function TextField({ label, value, onChange, placeholder, testId }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <input data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-4 py-3 text-white placeholder:text-white/30" />
    </label>
  );
}
function TextArea({ label, value, onChange, placeholder, testId }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <textarea data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-4 py-3 text-white placeholder:text-white/30 resize-y" />
    </label>
  );
}

function ChipEditor({ label, items, onAdd, onRemove, testId }) {
  const [v, setV] = useState("");
  return (
    <div>
      <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 border border-white/15 hover:border-[#E4F222] transition-colors px-3 py-1.5 text-sm">
            {it}
            <button onClick={() => onRemove(i)} className="text-white/40 hover:text-[#FF3B30]"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input data-testid={testId} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(v.trim()); setV(""); } }} placeholder={`Add ${label.toLowerCase()}…`} className="flex-1 bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-3 py-2 text-sm" />
        <button onClick={() => { onAdd(v.trim()); setV(""); }} className="border border-white/15 hover:border-[#E4F222] hover:text-[#E4F222] px-3 transition-colors"><Plus className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function PortfolioEditor({ items, onChange }) {
  const [title, setTitle] = useState(""); const [url, setUrl] = useState("");
  const add = () => { if (!title) return; onChange([...items, { title, url }]); setTitle(""); setUrl(""); };
  return (
    <div>
      <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-3">Portfolio</div>
      <div className="grid md:grid-cols-2 gap-3 mb-3">
        {items.map((p, i) => (
          <a key={i} href={p.url || "#"} target="_blank" rel="noreferrer" className="group border border-white/10 hover:border-[#E4F222] p-4 transition-colors flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-lg truncate">{p.title}</div>
              <div className="text-white/40 text-xs truncate">{p.url}</div>
            </div>
            <button onClick={(e) => { e.preventDefault(); onChange(items.filter((_, k) => k !== i)); }} className="text-white/30 hover:text-[#FF3B30]"><X className="w-4 h-4" /></button>
          </a>
        ))}
      </div>
      <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-3 py-2 text-sm" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-3 py-2 text-sm" />
        <button onClick={add} className="border border-white/15 hover:border-[#E4F222] hover:text-[#E4F222] px-4 py-2 font-mono-accent text-[10px] uppercase tracking-[0.22em] transition-colors">Add</button>
      </div>
    </div>
  );
}

// Public profile view (read-only)
export function UserProfileView() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const [u, setU] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stars, setStars] = useState(5); const [text, setText] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try { setU(await api.getUser(userId)); } catch {}
      try { setReviews(await api.reviews(userId)); } catch {}
    })();
  }, [userId]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.leaveReview(userId, { stars, text });
      setReviews(await api.reviews(userId));
      setText(""); setStars(5);
      setU(await api.getUser(userId));
    } finally { setBusy(false); }
  };

  if (!u) return <AppShell><div className="p-10 text-white/50">Loading…</div></AppShell>;

  return (
    <AppShell>
      <PageHeader chapter="Public profile" title={u.name} subtitle={u.bio || "—"} />
      <div className="px-6 md:px-10 py-10 grid lg:grid-cols-[320px_1fr] gap-10">
        <div className="space-y-6">
          <div className="w-full aspect-square border border-white/10 bg-white/[0.03] grid place-items-center overflow-hidden">
            {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : <span className="font-brand text-5xl">{u.name?.[0]?.toUpperCase()}</span>}
          </div>
          <div className="border border-white/10 p-5 space-y-2">
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-[#E4F222]" /><span className="font-display text-xl">{u.rating ? u.rating.toFixed(2) : "—"}</span> <span className="text-white/40 text-xs">/ 5 · {u.review_count || 0}</span></div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">{u.role}</div>
          </div>
        </div>
        <div className="space-y-8">
          {CHIP_LISTS.map((c) => (u[c.key]?.length ? (
            <div key={c.key}>
              <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-3">{c.label}</div>
              <div className="flex flex-wrap gap-2">{u[c.key].map((it, i) => <span key={i} className="border border-white/15 px-3 py-1.5 text-sm">{it}</span>)}</div>
            </div>
          ) : null))}

          {/* Reviews */}
          <div>
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-4">Reviews ({reviews.length})</div>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.review_id} className="border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{r.author_name}</span>
                    <span className="text-[#E4F222] font-mono-accent text-sm">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                  </div>
                  <p className="text-white/70 text-sm">{r.text}</p>
                </div>
              ))}
              {reviews.length === 0 && <p className="text-white/40 text-sm">No reviews yet.</p>}
            </div>
            {me && me.user_id !== userId && (
              <div className="mt-6 border border-white/10 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {[1,2,3,4,5].map(n => <button key={n} onClick={() => setStars(n)} className={n <= stars ? "text-[#E4F222]" : "text-white/20"}>★</button>)}
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Leave a note (optional)" className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-3 py-2 text-sm" />
                <button data-testid="submit-review" onClick={submit} disabled={busy} className="mt-3 bg-[#E4F222] text-[#08090a] px-4 py-2 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold">Post review</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
