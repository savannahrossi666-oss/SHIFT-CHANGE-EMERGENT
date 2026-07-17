import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  MessagesSquare, ListChecks, Files, GitBranch, StickyNote, DollarSign,
  Send, Plus, Paperclip, Loader2, Check, Circle,
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
  const wsRef = useRef(null);

  const reload = async () => {
    try { setWs(await api.getWorkspace(workspaceId)); } catch {}
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [workspaceId]);

  // WebSocket
  useEffect(() => {
    if (!user) return;
    const socket = new WebSocket(api.wsUrl());
    wsRef.current = socket;
    socket.onopen = () => socket.send(JSON.stringify({ type: "join", workspace_id: workspaceId }));
    socket.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === "message") setWs((w) => w ? { ...w, messages: [...(w.messages || []), m.data] } : w);
      if (m.type === "task_added") setWs((w) => w ? { ...w, tasks: [...(w.tasks || []), m.data] } : w);
      if (m.type === "task_updated") setWs((w) => w ? { ...w, tasks: (w.tasks || []).map(t => t.task_id === m.data.task_id ? { ...t, done: m.data.done } : t) } : w);
      if (m.type === "file_uploaded") setWs((w) => w ? { ...w, files: [m.data, ...(w.files || [])] } : w);
    };
    socket.onclose = () => {};
    return () => socket.close();
    // eslint-disable-next-line
  }, [workspaceId, user?.user_id]);

  if (!ws) return <AppShell><div className="p-10 text-white/50">Loading workspace…</div></AppShell>;

  const progress = ws.tasks?.length ? Math.round((ws.tasks.filter(t => t.done).length / ws.tasks.length) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        chapter="Workspace"
        title={ws.shift_title}
        subtitle={`${ws.participants?.length || 0} participants · Progress ${progress}%`}
        actions={
          <div className="flex items-center gap-3">
            <span className={`font-mono-accent text-[10px] uppercase tracking-[0.25em] px-3 py-2 border ${ws.payment_status === "paid" || ws.payment_status === "released" ? "border-[#E4F222]/50 text-[#E4F222]" : "border-white/15 text-white/60"}`}>{ws.payment_status}</span>
            <Link to={`/shifts/${ws.shift_id}`} className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-white">← Shift</Link>
          </div>
        }
      />

      <div className="border-b border-white/10 px-6 md:px-10 sticky top-16 bg-[#08090a]/85 backdrop-blur-xl z-30">
        <div className="flex overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 md:px-5 py-4 border-b-2 font-mono-accent text-[11px] uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${tab === t.key ? "border-[#E4F222] text-white" : "border-transparent text-white/50 hover:text-white"}`}>
              <t.Icon className="w-3.5 h-3.5" /> {t.label}
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
        {tab === "payment" && <PaymentTab ws={ws} onChange={reload} />}
      </div>
    </AppShell>
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

function PaymentTab({ ws, onChange }) {
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    try { await api.pay(ws.workspace_id); await onChange(); } finally { setBusy(false); }
  };
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border border-white/10 p-6">
        <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">Payment status</div>
        <div className={`font-display text-3xl ${ws.payment_status === "paid" || ws.payment_status === "released" ? "text-[#E4F222]" : "text-white"}`}>{ws.payment_status}</div>
        <p className="mt-3 text-white/60 text-sm">Stripe integration is a follow-up. This button marks payment status as <em>paid</em> for prototype flow validation.</p>
        {ws.payment_status === "pending" && (
          <button data-testid="pay-btn" onClick={pay} disabled={busy} className="mt-6 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-6 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">{busy ? "Processing…" : "Mark as paid (MOCKED)"}</button>
        )}
      </div>
    </div>
  );
}
