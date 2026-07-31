import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Circle, Files, ListChecks, MessageSquare, Sparkles, StickyNote } from "lucide-react";
import { getWorkspaceMode } from "./workspacePersonalization";

const DEMOS = [
  { key: "audio", label: "Beat maker", shift_title: "Finish + mix a custom beat", shift_description: "Music production, beat making, vocal editing and final audio delivery", shift_price: 180, skills: ["Beat making", "Music production", "Audio editing"] },
  { key: "visual", label: "Photographer", shift_title: "Portrait session + edited selects", shift_description: "Photography, camera work and edited visual delivery", shift_price: 250, skills: ["Photography", "Photoshop"] },
  { key: "digital", label: "Web builder", shift_title: "Build a landing page", shift_description: "React web development and UX/UI implementation", shift_price: 400, skills: ["React", "Web development", "UX/UI design"] },
  { key: "onsite", label: "Mover", shift_title: "Help unload a moving truck", shift_description: "On-site moving help and completion photos", shift_price: 120, skills: ["Moving help", "Hands-on work"] },
];

export function WorkspacePreview() {
  const [selected, setSelected] = useState(DEmosafe(DEMOS[0]));
  const [done, setDone] = useState([true, false, false]);
  const mode = useMemo(() => getWorkspaceMode(selected, { skills: selected.skills }), [selected]);
  const progress = Math.round((done.filter(Boolean).length / done.length) * 100);

  return (
    <main className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <div className="border-b border-white/10 px-6 md:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-white/45 hover:text-[#E4F222] text-xs uppercase tracking-[0.2em]"><ArrowLeft className="w-3.5 h-3.5" /> Shift Change</Link>
          <div className="mt-3 flex items-center gap-2 text-[#E4F222] text-[10px] uppercase tracking-[0.28em]"><Sparkles className="w-3.5 h-3.5" /> Personalized workspace preview</div>
          <h1 className="font-display text-3xl md:text-5xl mt-2">{selected.shift_title}</h1>
          <p className="text-white/45 mt-2">{mode.label} · {progress}% complete · ${selected.shift_price}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMOS.map((demo) => <button key={demo.key} onClick={() => { setSelected(DEmosafe(demo)); setDone([true, false, false]); }} className={`px-3 py-2 border text-[10px] uppercase tracking-[0.18em] ${selected.key === demo.key ? "border-[#E4F222] text-[#E4F222]" : "border-white/15 text-white/50 hover:text-white"}`}>{demo.label}</button>)}
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 grid lg:grid-cols-[1.4fr_.8fr] gap-6">
        <section className="space-y-6">
          <div className="border border-[#E4F222]/30 bg-[#E4F222]/[0.035] p-6">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#E4F222]">Your room changed for this shift</div>
            <h2 className="font-display text-2xl mt-2">{mode.label}</h2>
            <p className="text-white/55 text-sm mt-2 max-w-2xl">Shift Change uses the work itself and your skill profile to surface the tools that matter for this job.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {mode.modules.map((module, i) => <div key={module.title} className="border border-white/10 p-5 min-h-40"><div className="text-[#E4F222] text-xs">0{i + 1}</div><h3 className="font-display text-xl mt-5">{module.title}</h3><p className="text-white/45 text-sm mt-2 leading-relaxed">{module.description}</p></div>)}
          </div>

          <div className="border border-white/10 p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55"><ListChecks className="w-4 h-4" /> Smart next steps</div>
            <div className="mt-4 space-y-2">{mode.prompts.map((prompt, i) => <button key={prompt} onClick={() => setDone((old) => old.map((v, idx) => idx === i ? !v : v))} className="w-full border border-white/10 hover:border-[#E4F222]/40 p-4 flex items-center gap-3 text-left">{done[i] ? <Check className="w-4 h-4 text-[#E4F222]" /> : <Circle className="w-4 h-4 text-white/30" />}<span className={done[i] ? "text-white/40 line-through" : "text-white/80"}>{prompt}</span></button>)}</div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="border border-white/10 p-5"><div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Skills powering this room</div><div className="flex flex-wrap gap-2 mt-4">{selected.skills.map((skill) => <span key={skill} className="border border-[#E4F222]/30 text-[#E4F222] px-2.5 py-1.5 text-xs">{skill}</span>)}</div></div>
          {[ [MessageSquare,"Chat","Talk with the person you're working with."], [Files,"Files","Drafts, references and final deliverables."], [StickyNote,"Notes","Shared context stays attached to the shift."], [ListChecks,"Tasks","The universal layer underneath every specialized room."] ].map(([Icon,title,text]) => <div key={title} className="border border-white/10 p-4 flex gap-3"><Icon className="w-4 h-4 text-[#E4F222] mt-0.5"/><div><div className="text-sm">{title}</div><div className="text-xs text-white/40 mt-1">{text}</div></div></div>)}
        </aside>
      </div>
    </main>
  );
}

function Demosafe(demo) { return { ...demo }; }
