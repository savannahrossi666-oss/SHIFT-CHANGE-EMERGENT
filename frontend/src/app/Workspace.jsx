import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PaymentModal, CompletionModal } from "./Modals";
import {
  MessagesSquare, ListChecks, Files, GitBranch, StickyNote, DollarSign,
  Send, Plus, Paperclip, Loader2, Check, Circle, CheckCircle2, ShieldCheck, Sparkles,
} from "lucide-react";

const TABS = [
  { key: "chat", label: "Chat", Icon: MessagesSquare },
  { key: "tasks", label: "Tasks", Icon: ListChecks },
  { key: "files", label: "Files", Icon: Files },
  { key: "timeline", label: "Timeline", Icon: GitBranch },
  { key: "notes", label: "Notes", Icon: StickyNote },
  { key: "payment", label: "Payment", Icon: DollarSign },
];

// -------------- LIST --------------
export function WorkspacesList() {
  const [items, setItems] = useState([]);
  useEffect(() => { (async () => { try { setItems(await api.myWorkspaces()); } catch {} })(); }, []);
  return (
    <AppShell>
      <PageHeader chapter="Workspaces" title="Every accepted shift lives here." subtitle="Chat, tasks, files, timeline — one room per shift." />
      <div className="px-6 md:px-10 py-10">
        {items.length === 0 ? (
          <div className="border border-dashed border-white/10 p-16 text-center text-white/40">No workspaces yet.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((w) => (
              <Link key={w.workspace_id} to={`/workspace/${w.workspace_id}`} data-testid={`ws-card-${w.workspace_id}`} className="group border border-white/10 hover:border-[#E4F222] transition-colors p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">workspace</span>
                  <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/40">{w.payment_status}</span>
                </div>
                <h3 className="font-display text-xl leading-tight">{w.shift_title}</h3>
                <div className="mt-4 text-white/40 text-xs">{w.tasks?.length || 0} tasks · {w.participants?.length || 0} people</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// -------------- DETAIL --------------
export function Workspace() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [ws, setWs] = useState(null);
  const [tab, setTab] = useState("chat");
  const [payOpen, setPayOpen] = useState(false);
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [other, setOther] = useState(null);
  const wsRef = useRef(null);

  const reload = async () => {
    try {
      const w = await api.getWorkspace(workspaceId);
      setWs(w);
      // Fetch counterpart profile for celebration modal
      const otherId = w.participants?.find((id) => id !== user?.user_id);
      if (otherId && !other) {
        try { setOther(await api.getUser(otherId)); } catch {}
      }
    } catch {}
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [workspaceId]);

  // WebSocket
  useEffect(() => {
    if (!user) return;
    let socket;
    try {
      socket = new WebSocket(api.wsUrl());
      wsRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ type: "join", workspace_id: workspaceId }));
      socket.onmessage = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.type === "message") setWs((w) => w ? { ...w, messages: [...(w.messages || []), m.data] } : w);
        if (m.type === "task_added") setWs((w) => w ? { ...w, tasks: [...(w.tasks || []), m.data] } : w);
        if (m.type === "task_updated") setWs((w) => w ? { ...w, tasks: (w.tasks || []).map(t => t.task_id === m.data.task_id ? { ...t, done: m.data.done } : t) } : w);
        if (m.type === "file_uploaded") setWs((w) => w ? { ...w, files: [m.data, ...(w.files || [])] } : w);
      };
    } catch {}
    return () => { try { socket?.close(); } catch {} };
    // eslint-disable-next-line
  }, [workspaceId, user?.user_id]);

  const markComplete = async () => {
    try { await api.actionShift(ws.shift_id, "complete"); await reload(); setCelebrateOpen(true); } catch {}
  };

  if (!ws) return <AppShell><div className="p-10 text-white/50">Loading workspace…</div></AppShell>;

  const progress = ws.tasks?.length ? Math.round((ws.tasks.filter(t => t.done).length / ws.tasks.length) * 100) : 0;
  const isOwner = user?.user_id === ws.owner_id;
  const isAccepter = user?.user_id === ws.accepted_by;
  const canPay = isOwner && ws.payment_status === "pending";
  const canComplete = (isOwner || isAccepter) && ws.payment_status !== "released";

  return (
    <AppShell>
      <PageHeader
        chapter="Workspace"
        title={ws.shift_title}
        subtitle={`${ws.participants?.length || 0} participants · Progress ${progress}% · $${(ws.shift_price ?? 0).toFixed(2)}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusPill status={ws.payment_status} />
            {canPay && (
              <button data-testid="header-pay-btn" onClick={() => setPayOpen(true)} className="group flex items-center gap-2 bg-[#E4F222] text-[#08090a] px-4 py-2.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
                Pay ${(ws.shift_price ?? 0).toFixed(0)} · Simulated
              </button>
            )}
            {canComplete && ws.payment_status !== "pending" && (
              <button data-testid="header-complete-btn" onClick={markComplete} className="group flex items-center gap-2 border border-[#E4F222]/40 hover:border-[#E4F222] text-[#E4F222] px-4 py-2.5 font-mono-accent text-[11px] uppercase tracking-[0.22em]">
                Mark complete <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      />

      <div className="border-b border-white/10 px-6 md:px-10 sticky top-16 bg-[#08090a]/85 backdrop-blur-xl z-30">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 md:px-5 py-4 border-b-2 font-mono-accent text-[11px] uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${tab === t.key ? "border-[#E4F222] text-white" : "border-transparent text-white/50 hover:text-white"}`}>
              <t.Icon className="w-3.5 h-3.5" /> {t.label}
              {t.key === "payment" && ws.payment_status !== "pending" && <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full ml-1" />}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-10 py-8">
        {tab === "chat" && <ChatTab ws={ws} user={user} onSend={reload} />}
        {tab === "tasks" && <TasksTab ws={ws} onChange={reload} />}
        {tab === "files" && <FilesTab ws={ws} onChange={reload} />}
        {tab === "timeline" && <TimelineTab ws={ws} />}
        {tab === "notes" && <NotesTab ws={ws} onChange={reload} />}
        {tab === "payment" && <PaymentTab ws={ws} isOwner={isOwner} onPay={() => setPayOpen(true)} onComplete={markComplete} other={other} />}
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        workspace={{ ...ws, payer_name: user?.name, payee_name: other?.name }}
        onPaid={reload}
      />
      <CompletionModal open={celebrateOpen} onClose={() => setCelebrateOpen(false)} workspace={ws} otherUser={other} />
    </AppShell>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { label: "Awaiting payment", tone: "muted" },
    held: { label: "$ Escrow", tone: "accent" },
    released: { label: "Released", tone: "accent" },
    paid: { label: "Paid", tone: "accent" },
  };
  const m = map[status] || map.pending;
  return (
    <span className={`font-mono-accent text-[10px] uppercase tracking-[0.25em] px-3 py-2 border ${m.tone === "accent" ? "border-[#E4F222]/50 text-[#E4F222]" : "border-white/15 text-white/60"}`}>{m.label}</span>
  );
}

// ---------- TABS ----------
function ChatTab({ ws, user, onSend }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ws.messages?.length]);
  const send = async (e) => {
    e.preventDefault(); if (!text.trim()) return;
    const t = text; setText("");
    try { await api.sendMessage(ws.workspace_id, t); } catch {}
  };
  return (
    <div className="max-w-3xl mx-auto">
      <div className="border border-white/10 h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
          {(ws.messages || []).length === 0 && <p className="text-white/40 text-sm">No messages yet — say hello.</p>}
          {(ws.messages || []).map((m) => {
            const mine = m.user_id === user.user_id;
            return (
              <div key={m.msg_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 border ${mine ? "border-[#E4F222]/40 bg-[#E4F222]/[0.06]" : "border-white/15 bg-white/[0.02]"}`}>
                  {!mine && <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-white/50 mb-1">{m.user_name}</div>}
                  <div className="text-white/90 text-sm whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="border-t border-white/10 flex items-center gap-2 p-3">
          <input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="flex-1 bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-2.5 text-sm" />
          <button data-testid="chat-send" className="bg-[#E4F222] text-[#08090a] px-4 py-2.5 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors"><Send className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
}

function TasksTab({ ws, onChange }) {
  const [title, setTitle] = useState(""); const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault(); if (!title.trim()) return;
    setBusy(true);
    try { await api.addTask(ws.workspace_id, title.trim()); setTitle(""); await onChange(); } finally { setBusy(false); }
  };
  const toggle = async (t) => { await api.toggleTask(ws.workspace_id, t.task_id, !t.done); await onChange(); };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <form onSubmit={add} className="flex gap-2">
        <input data-testid="task-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" className="flex-1 bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3 text-sm" />
        <button data-testid="task-add" disabled={busy} className="bg-[#E4F222] text-[#08090a] px-4 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </form>
      <div className="space-y-2">
        {(ws.tasks || []).length === 0 && <p className="text-white/40 text-sm">No tasks yet.</p>}
        {(ws.tasks || []).map((t) => (
          <button key={t.task_id} onClick={() => toggle(t)} data-testid={`task-${t.task_id}`} className="w-full flex items-center gap-3 border border-white/10 hover:border-[#E4F222]/40 transition-colors p-4 text-left group">
            {t.done ? <Check className="w-4 h-4 text-[#E4F222]" /> : <Circle className="w-4 h-4 text-white/30 group-hover:text-white/60" />}
            <span className={`flex-1 ${t.done ? "line-through text-white/40" : "text-white"}`}>{t.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FilesTab({ ws, onChange }) {
  const [busy, setBusy] = useState(false);
  const onUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try { await api.uploadFile(ws.workspace_id, { name: f.name, mime: f.type, size: f.size, data: reader.result }); await onChange(); } finally { setBusy(false); }
    };
    reader.readAsDataURL(f);
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <label className="block cursor-pointer group border border-dashed border-white/15 hover:border-[#E4F222] transition-colors p-10 text-center">
        {busy ? <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#E4F222]" /> : <>
          <Paperclip className="w-5 h-5 mx-auto text-white/40 group-hover:text-[#E4F222] mb-3" />
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/60">Click to upload · MOCKED cloud storage (base64 in Mongo)</div>
        </>}
        <input data-testid="file-input" type="file" onChange={onUpload} className="hidden" />
      </label>
      <div className="space-y-2">
        {(ws.files || []).length === 0 && <p className="text-white/40 text-sm">No files uploaded.</p>}
        {(ws.files || []).map((f) => (
          <div key={f.file_id} className="border border-white/10 p-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm truncate">{f.name}</div>
              <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-white/40">{Math.round((f.size || 0) / 1024)} kb · by {f.user_name}</div>
            </div>
            <button onClick={async () => {
              const doc = await api.getFile(ws.workspace_id, f.file_id);
              const a = document.createElement("a"); a.href = doc.data; a.download = doc.name; a.click();
            }} className="font-mono-accent text-[10px] uppercase tracking-[0.22em] text-[#E4F222] hover:underline">Download</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({ ws }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative border-l border-white/10 pl-6 space-y-6">
        {(ws.timeline || []).slice().reverse().map((e, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-[29px] top-1 w-3 h-3 border border-[#E4F222] bg-[#08090a] rounded-full" />
            <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">{e.type}</div>
            <div className="text-white/80 text-sm">{e.text}</div>
            <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">{new Date(e.ts).toLocaleString()}</div>
          </div>
        ))}
        {(ws.timeline || []).length === 0 && <p className="text-white/40 text-sm">No events yet.</p>}
      </div>
    </div>
  );
}

function NotesTab({ ws, onChange }) {
  const [val, setVal] = useState(ws.notes || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await api.updateNotes(ws.workspace_id, val); await onChange(); } finally { setSaving(false); }
  };
  return (
    <div className="max-w-3xl mx-auto">
      <textarea data-testid="notes-input" value={val} onChange={(e) => setVal(e.target.value)} rows={16} placeholder="Shared notes for this workspace…" className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3 text-white placeholder:text-white/30 resize-y" />
      <div className="mt-3 flex justify-end">
        <button data-testid="notes-save" onClick={save} disabled={saving} className="bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-5 py-2.5 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">{saving ? "Saving…" : "Save notes"}</button>
      </div>
    </div>
  );
}

function PaymentTab({ ws, isOwner, onPay, onComplete, other }) {
  const [receipt, setReceipt] = useState(null);
  useEffect(() => {
    if (ws.payment_status !== "pending") { api.getReceipt(ws.workspace_id).then(setReceipt).catch(() => {}); }
  }, [ws.workspace_id, ws.payment_status]);

  const stages = [
    { key: "posted", label: "Shift posted", done: true },
    { key: "accepted", label: "Accepted", done: true },
    { key: "held", label: "Payment held in escrow", done: ["held", "released"].includes(ws.payment_status), active: ws.payment_status === "pending" },
    { key: "released", label: "Released to earner", done: ws.payment_status === "released", active: ws.payment_status === "held" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Big amount hero */}
      <div className="border border-white/10 p-8 md:p-10 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#E4F222]/[0.08] blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 font-mono-accent text-[10px] uppercase tracking-[0.28em] text-[#E4F222] mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Simulated escrow — no real card is charged
          </div>
          <div className="font-display text-5xl md:text-6xl tracking-[-0.03em]">
            <span className="text-white/40">$</span>{(ws.shift_price ?? 0).toFixed(2)}
          </div>
          <div className="mt-1 font-mono-accent text-[10px] uppercase tracking-[0.22em] text-white/50">{ws.shift_currency || "USD"}</div>
          <p className="mt-6 text-white/60 max-w-xl">Payment is held safely inside Shift Change. The moment the shift is marked complete, funds release to {other?.name || "the earner"} automatically.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {ws.payment_status === "pending" && isOwner && (
              <button data-testid="pay-btn" onClick={onPay} className="group flex items-center gap-3 bg-[#E4F222] text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
                Pay ${(ws.shift_price ?? 0).toFixed(2)} into escrow <ArrowRightIcon />
              </button>
            )}
            {ws.payment_status === "held" && (
              <button data-testid="complete-btn" onClick={onComplete} className="group flex items-center gap-3 border border-[#E4F222] text-[#E4F222] hover:bg-[#E4F222] hover:text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] transition-colors">
                Mark shift complete & release <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            {ws.payment_status === "released" && (
              <div className="inline-flex items-center gap-3 bg-[#E4F222]/[0.08] border border-[#E4F222]/40 px-5 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] text-[#E4F222]">
                <CheckCircle2 className="w-4 h-4" /> Released to {other?.name || "earner"} · ${(ws.shift_price ?? 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escrow stages */}
      <div className="border border-white/10 p-6">
        <div className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/50 mb-6">Escrow stages</div>
        <div className="relative grid grid-cols-4 gap-2">
          {stages.map((s, i) => (
            <div key={s.key} className="relative">
              <div className={`w-8 h-8 rounded-full grid place-items-center border ${s.done ? "border-[#E4F222] bg-[#E4F222] text-[#08090a]" : s.active ? "border-[#E4F222] text-[#E4F222] animate-pulse" : "border-white/20 text-white/30"}`}>
                {s.done ? <Check className="w-4 h-4" /> : <span className="text-xs font-mono-accent">{i + 1}</span>}
              </div>
              <div className={`mt-3 font-mono-accent text-[10px] uppercase tracking-[0.2em] ${s.done ? "text-white" : s.active ? "text-[#E4F222]" : "text-white/40"}`}>{s.label}</div>
              {i < stages.length - 1 && <div className={`absolute top-4 left-8 right-0 h-px ${stages[i + 1].done ? "bg-[#E4F222]" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Receipt */}
      {receipt && (
        <div data-testid="receipt-card" className="border border-white/10 p-6">
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/50 mb-4">Receipt</div>
          <div className="divide-y divide-white/[0.06] font-mono-accent text-[11px] uppercase tracking-[0.15em]">
            <RRow k="Receipt" v={receipt.receipt_id} />
            <RRow k="Amount" v={`$${receipt.amount?.toFixed(2)} ${receipt.currency}`} />
            <RRow k="Method" v={`${receipt.card_brand} •••• ${receipt.card_last4}`} />
            <RRow k="Status" v={ws.payment_status === "released" ? "Released" : "Held in escrow"} tone="accent" />
            <RRow k="Paid" v={new Date(receipt.created_at).toLocaleString()} />
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-white/40">This is a simulated receipt — Shift Change did not process a real card.</p>
        </div>
      )}
    </div>
  );
}
function ArrowRightIcon() { return <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>; }
function RRow({ k, v, tone }) {
  return (
    <div className="flex items-center justify-between py-3 px-1">
      <span className="text-white/40">{k}</span>
      <span className={tone === "accent" ? "text-[#E4F222]" : "text-white"}>{v}</span>
    </div>
  );
}
