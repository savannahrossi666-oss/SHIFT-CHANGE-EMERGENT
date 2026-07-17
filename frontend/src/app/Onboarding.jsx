import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";

/**
 * OnboardingChecklist
 * Persistent dismissible progress banner on the dashboard that tells a first-time tester
 * exactly what to do next to experience the full loop.
 */
export function OnboardingChecklist({ user, myShifts = [], workspaces = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("sc_onboarding_dismissed") === "1");

  const steps = useMemo(() => {
    const profileDone = Boolean(user?.bio && (user.skills?.length || user.services?.length));
    const postedShift = myShifts.some((s) => s.owner_id === user?.user_id);
    const inWorkspace = workspaces.length > 0;
    const chattedOrTasked = workspaces.some((w) => (w.tasks?.length || 0) > 0);
    const paidOrCompleted = workspaces.some((w) => ["held", "released"].includes(w.payment_status));
    const completed = workspaces.some((w) => w.payment_status === "released");
    return [
      { key: "profile", label: "Round out your profile", detail: "Add a bio and at least one skill or service.", to: "/profile", done: profileDone },
      { key: "post", label: "Post your first shift", detail: "Or skip and accept a demo shift below.", to: "/shifts/new", done: postedShift },
      { key: "accept", label: "Open a workspace", detail: "Accept any shift to spin up its dedicated workspace.", to: "/shifts", done: inWorkspace },
      { key: "collab", label: "Add a task or send a message", detail: "The workspace becomes the heart of every shift.", to: workspaces[0] ? `/workspace/${workspaces[0].workspace_id}` : "/workspaces", done: chattedOrTasked },
      { key: "pay", label: "Simulate a payment", detail: "See how escrow holds funds until the work is done.", to: workspaces[0] ? `/workspace/${workspaces[0].workspace_id}` : "/workspaces", done: paidOrCompleted },
      { key: "complete", label: "Mark the shift complete", detail: "Funds release + your review lifts a reputation.", to: workspaces[0] ? `/workspace/${workspaces[0].workspace_id}` : "/workspaces", done: completed },
    ];
  }, [user, myShifts, workspaces]);

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);

  if (dismissed || doneCount === steps.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      data-testid="onboarding-checklist"
      className="relative border border-[#E4F222]/30 bg-gradient-to-br from-[#E4F222]/[0.06] via-transparent to-transparent"
    >
      <button data-testid="onboarding-dismiss" onClick={() => { setDismissed(true); localStorage.setItem("sc_onboarding_dismissed", "1"); }} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
      <button onClick={() => setCollapsed(!collapsed)} className="w-full text-left p-6 flex items-center gap-4">
        <div className="w-11 h-11 grid place-items-center border border-[#E4F222]/40 bg-[#08090a]">
          <Sparkles className="w-4 h-4 text-[#E4F222]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-[#E4F222] mb-1">Try the full loop · {doneCount}/{steps.length}</div>
          <div className="font-display text-xl md:text-2xl leading-tight tracking-tight truncate">
            {nextStep ? <>Next: <span className="text-[#E4F222]">{nextStep.label}</span></> : "You've completed the tour."}
          </div>
        </div>
        {/* Progress ring-ish bar */}
        <div className="hidden sm:flex flex-col items-end gap-2 mr-8">
          <div className="w-40 h-1.5 bg-white/10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} className="h-full bg-[#E4F222]" />
          </div>
          <span className="font-mono-accent text-[10px] uppercase tracking-[0.22em] text-white/50">{pct}%</span>
        </div>
        {collapsed ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronUp className="w-4 h-4 text-white/50" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 divide-y divide-white/[0.06]">
              {steps.map((s, i) => (
                <Link key={s.key} to={s.to} data-testid={`onboarding-step-${s.key}`} className="group flex items-start gap-4 p-4 px-6 hover:bg-white/[0.02] transition-colors">
                  {s.done ? <CheckCircle2 className="w-5 h-5 text-[#E4F222] shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-white/25 shrink-0 mt-0.5 group-hover:text-white/60" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-accent text-[9px] uppercase tracking-[0.22em] text-white/30 w-8">{String(i + 1).padStart(2, "0")}</span>
                      <span className={`font-display text-lg tracking-tight ${s.done ? "text-white/50 line-through" : "text-white"}`}>{s.label}</span>
                    </div>
                    <p className="ml-11 mt-1 text-white/50 text-sm">{s.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
