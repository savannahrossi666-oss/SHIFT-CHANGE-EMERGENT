import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell, PageHeader } from "./AppShell";
import { ASSESSMENT_SECTIONS, buildAssessmentResult } from "./assessmentData";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

export function Assessment() {
  const { user, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const section = ASSESSMENT_SECTIONS[step];
  const result = useMemo(() => buildAssessmentResult(selections), [selections]);

  const toggle = (label) => {
    const current = selections[section.id] || [];
    const next = current.includes(label) ? current.filter((x) => x !== label) : [...current, label];
    setSelections({ ...selections, [section.id]: next });
  };

  const finishAssessment = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const skills = [...new Set([...(user?.skills || []), ...result.skills])];
      const services = [...new Set([...(user?.services || []), ...result.suggestedServices])];
      await api.updateProfile({ skills, services });
      await refresh();
      setFinished(true);
    } catch (err) {
      setSaveError(err?.message || "We couldn't save your skill map. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (finished) return <AssessmentResults result={result} onRetake={() => { setFinished(false); setStep(0); setSelections({}); }} />;

  return (
    <AppShell>
      <PageHeader chapter="Skill discovery" title="What can you turn into opportunity?" subtitle="No job titles. No personality type. Map the things you can actually do, use, make, fix, teach or learn." />
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-10">
          {ASSESSMENT_SECTIONS.map((s, i) => <div key={s.id} className={`h-1 flex-1 ${i <= step ? "bg-[#E4F222]" : "bg-white/10"}`} />)}
        </div>

        <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222] mb-3">0{step + 1} / 0{ASSESSMENT_SECTIONS.length}</div>
        <h2 className="font-display text-4xl md:text-6xl leading-none mb-3">{section.title}</h2>
        <p className="text-white/55 max-w-2xl mb-8">{section.subtitle}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {section.options.map(([label, skills]) => {
            const active = (selections[section.id] || []).includes(label);
            return (
              <button key={label} onClick={() => toggle(label)} className={`text-left min-h-32 border p-5 transition-colors ${active ? "border-[#E4F222] bg-[#E4F222]/[0.07]" : "border-white/10 hover:border-white/30 bg-white/[0.02]"}`}>
                <div className="flex justify-between gap-4">
                  <span className="font-display text-xl">{label}</span>
                  <span className={`w-6 h-6 border grid place-items-center shrink-0 ${active ? "border-[#E4F222] bg-[#E4F222] text-black" : "border-white/20"}`}>{active && <Check className="w-4 h-4" />}</span>
                </div>
                <div className="mt-5 text-xs text-white/35">{skills.join(" · ")}</div>
              </button>
            );
          })}
        </div>

        {saveError && <p className="mt-6 text-sm text-red-300">{saveError}</p>}
        <div className="flex justify-between mt-10 border-t border-white/10 pt-6">
          <button disabled={step === 0 || saving} onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-white/50 disabled:opacity-20 hover:text-white font-mono-accent text-[10px] uppercase tracking-[0.22em]"><ArrowLeft className="w-4 h-4" /> Back</button>
          {step < ASSESSMENT_SECTIONS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-3 bg-[#E4F222] text-black px-6 py-3 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold">Continue <ArrowRight className="w-4 h-4" /></button>
          ) : (
            <button disabled={saving} onClick={finishAssessment} className="flex items-center gap-3 bg-[#E4F222] disabled:opacity-50 text-black px-6 py-3 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold">{saving ? "Saving skill map…" : "See my earning map"} <Sparkles className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function AssessmentResults({ result, onRetake }) {
  return (
    <AppShell>
      <PageHeader chapter="Your earning map" title="This is what SHIFT CHANGE sees in you." subtitle="These aren't job titles. They're signals we can use to shape your profile, discovery results and future workspace." />
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto space-y-6">
        <div className="border border-[#E4F222]/30 bg-[#E4F222]/[0.04] px-5 py-4 text-sm text-white/70"><span className="text-[#E4F222]">Saved.</span> Your strongest skills and suggested earning offers are now part of your SHIFT CHANGE profile.</div>
        <ResultBlock number="01" title="Skills to lead with" items={result.skills} empty="Choose more answers to uncover your strongest skills." />
        <ResultBlock number="02" title="Things you could offer" items={result.suggestedServices} empty="We'll suggest offers as your skill map grows." />
        <ResultBlock number="03" title="Skills you're growing" items={result.growthSkills} empty="Nothing selected yet — that's okay." />
        <div className="border border-[#E4F222]/30 bg-[#E4F222]/[0.04] p-6 md:p-8">
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222] mb-2">Next layer</div>
          <h3 className="font-display text-2xl mb-2">Your profile becomes proof.</h3>
          <p className="text-white/55 max-w-2xl">Your assessment maps what you can do. Your SHIFT CHANGE profile will show the work that proves it — projects, clips, before/afters, finished work and services people can hire you for.</p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/profile" className="bg-[#E4F222] text-black px-6 py-3 font-mono-accent text-[10px] uppercase tracking-[0.22em] font-semibold">See it on my profile</Link>
          <button onClick={onRetake} className="border border-white/15 hover:border-white/40 px-6 py-3 font-mono-accent text-[10px] uppercase tracking-[0.22em]">Retake</button>
        </div>
      </div>
    </AppShell>
  );
}

function ResultBlock({ number, title, items, empty }) {
  return (
    <section className="border border-white/10 p-6 md:p-8">
      <div className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/35 mb-2">{number}</div>
      <h3 className="font-display text-2xl mb-5">{title}</h3>
      {items.length ? <div className="flex flex-wrap gap-2">{items.map((item) => <span key={item} className="border border-white/15 px-3 py-2 text-sm">{item}</span>)}</div> : <p className="text-white/40 text-sm">{empty}</p>}
    </section>
  );
}
