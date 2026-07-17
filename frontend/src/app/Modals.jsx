import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, X, Sparkles, Star, Copy, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

// ----------------- MODAL SHELL -----------------
export function Modal({ open, onClose, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  const w = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#08090a]/85 backdrop-blur-md grid place-items-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${w} bg-[#0a0b0c] border border-white/10`}
            onClick={(e) => e.stopPropagation()}
          >
            <button data-testid="modal-close" onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ----------------- PAYMENT MODAL -----------------
// Multi-step: form → processing → receipt. Fully simulated.
export function PaymentModal({ open, onClose, workspace, onPaid }) {
  const [step, setStep] = useState("form"); // form | processing | success
  const [num, setNum] = useState("4242 4242 4242 4242");
  const [exp, setExp] = useState("12 / 28");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState(workspace?.payer_name || "");
  const [receipt, setReceipt] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (open) { setStep("form"); setErr(""); setReceipt(null); } }, [open, workspace?.workspace_id]);

  const brand = num.startsWith("4") ? "Visa" : num.startsWith("5") ? "Mastercard" : "Card";
  const amount = workspace?.shift_price ?? 0;

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (num.replace(/\s/g, "").length < 12) { setErr("Enter a valid card number"); return; }
    setStep("processing");
    try {
      // Fake a small processing delay for realism
      await new Promise((r) => setTimeout(r, 1400));
      const r = await api.pay(workspace.workspace_id, {
        card_brand: brand,
        card_last4: num.replace(/\s/g, "").slice(-4),
      });
      setReceipt(r.receipt);
      setStep("success");
      onPaid?.(r);
    } catch (e) {
      setErr(e.message); setStep("form");
    }
  };

  const formatNum = (v) => v.replace(/[^\d]/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <Modal open={open} onClose={step === "processing" ? undefined : onClose}>
      {step === "form" && (
        <div data-testid="payment-form" className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 grid place-items-center bg-[#E4F222]/10 border border-[#E4F222]/40">
              <CreditCard className="w-4 h-4 text-[#E4F222]" />
            </div>
            <span className="font-mono-accent text-[10px] uppercase tracking-[0.25em] text-[#E4F222]">Payment · Held in escrow</span>
          </div>
          <h2 className="font-display font-medium text-3xl md:text-4xl tracking-[-0.02em] mt-2">Pay <span className="text-[#E4F222]">${amount.toFixed(2)}</span></h2>
          <p className="mt-2 text-white/60 text-sm">For <span className="text-white">{workspace?.shift_title}</span>. Held safely until the work is marked complete.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Cardholder name" value={name} onChange={setName} testId="pay-name" />
            <Field label="Card number" value={num} onChange={(v) => setNum(formatNum(v))} testId="pay-number" trailing={<span className="text-white/40 text-xs font-mono-accent">{brand}</span>} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry" value={exp} onChange={setExp} testId="pay-exp" />
              <Field label="CVC" value={cvc} onChange={setCvc} testId="pay-cvc" trailing={<Lock className="w-3.5 h-3.5 text-white/40" />} />
            </div>
            {err && <p className="text-[#FF3B30] text-sm font-mono-accent">{err}</p>}

            <div className="flex items-start gap-3 border border-white/10 bg-white/[0.02] p-4 mt-2">
              <ShieldCheck className="w-4 h-4 text-[#E4F222] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-white/60">
                <span className="text-white">Simulated payment.</span> No real charge. Amount is held in escrow inside Shift Change and released to <span className="text-white">{workspace?.payee_name || "the earner"}</span> the moment the shift is marked complete.
              </p>
            </div>

            <button data-testid="pay-submit" className="w-full bg-[#E4F222] text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors flex items-center justify-center gap-3">
              Pay ${amount.toFixed(2)} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {step === "processing" && (
        <div data-testid="payment-processing" className="p-12 text-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="mx-auto w-16 h-16 grid place-items-center border border-[#E4F222]/40 bg-[#E4F222]/[0.05] mb-6">
            <Loader2 className="w-6 h-6 text-[#E4F222] animate-spin" />
          </motion.div>
          <div className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-3">Processing</div>
          <h3 className="font-display text-2xl">Authorizing your card…</h3>
          <p className="mt-2 text-white/50 text-sm">This usually takes 2 seconds.</p>
        </div>
      )}

      {step === "success" && receipt && (
        <div data-testid="payment-success" className="p-8">
          <motion.div initial={{ scale: 0.4, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto w-14 h-14 rounded-full grid place-items-center bg-[#E4F222] text-[#08090a] mb-6">
            <CheckCircle2 className="w-7 h-7" />
          </motion.div>
          <div className="text-center">
            <div className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-2">Payment held</div>
            <h3 className="font-display text-3xl tracking-[-0.02em]">${receipt.amount.toFixed(2)} secured</h3>
            <p className="mt-2 text-white/60 text-sm">Releases automatically the moment this shift is marked complete.</p>
          </div>

          <div className="mt-8 border border-white/10 divide-y divide-white/10 font-mono-accent text-[11px] uppercase tracking-[0.15em]">
            <ReceiptRow k="Receipt" v={receipt.receipt_id} copy />
            <ReceiptRow k="Amount" v={`$${receipt.amount.toFixed(2)} ${receipt.currency}`} />
            <ReceiptRow k="Method" v={`${receipt.card_brand} •••• ${receipt.card_last4}`} />
            <ReceiptRow k="Status" v="Held in escrow" tone="accent" />
            <ReceiptRow k="When" v={new Date(receipt.created_at).toLocaleString()} />
          </div>

          <button data-testid="payment-done" onClick={onClose} className="mt-8 w-full bg-white text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-[#E4F222] transition-colors">
            Back to workspace
          </button>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, onChange, testId, trailing }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/15 focus-within:border-[#E4F222] transition-colors px-4 py-3">
        <input data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent outline-none text-white" />
        {trailing}
      </div>
    </label>
  );
}

function ReceiptRow({ k, v, tone, copy }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => { navigator.clipboard?.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-white/40">{k}</span>
      <span className={`flex items-center gap-2 ${tone === "accent" ? "text-[#E4F222]" : "text-white"}`}>
        {v}
        {copy && <button onClick={doCopy} className="text-white/40 hover:text-white"><Copy className="w-3 h-3" /></button>}
        {copied && <span className="text-[9px] text-[#E4F222]">copied</span>}
      </span>
    </div>
  );
}

// ----------------- COMPLETION CELEBRATION -----------------
export function CompletionModal({ open, onClose, workspace, otherUser, onReview }) {
  const [stars, setStars] = useState(5); const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);

  useEffect(() => { if (open) { setStars(5); setText(""); setDone(false); } }, [open]);

  const submit = async () => {
    if (!otherUser?.user_id) { onClose?.(); return; }
    setBusy(true);
    try { await api.leaveReview(otherUser.user_id, { stars, text }); setDone(true); onReview?.(); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-10">
        {!done ? (
          <>
            <div className="text-center">
              <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="mx-auto w-16 h-16 rounded-full grid place-items-center bg-[#E4F222] text-[#08090a] mb-6">
                <Sparkles className="w-7 h-7" />
              </motion.div>
              <div className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-3">Shift complete</div>
              <h2 className="font-display text-4xl tracking-[-0.02em]">Nice work.</h2>
              <p className="mt-3 text-white/60 max-w-md mx-auto">Payment released. Reputation grows next — leave {otherUser?.name || "your partner"} a review.</p>
            </div>

            {otherUser && (
              <div className="mt-10 border border-white/10 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-white/10 grid place-items-center overflow-hidden">
                    {otherUser.photo ? <img alt="" src={otherUser.photo} className="w-full h-full object-cover" /> : <span className="font-brand text-lg">{otherUser.name?.[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <div className="font-display text-xl">{otherUser.name}</div>
                    <div className="font-mono-accent text-[10px] uppercase tracking-[0.22em] text-[#E4F222]">{otherUser.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  {[1,2,3,4,5].map((n) => (
                    <button key={n} data-testid={`rate-${n}`} onClick={() => setStars(n)} className={`transition-transform hover:scale-110 ${n <= stars ? "text-[#E4F222]" : "text-white/20"}`}>
                      <Star className="w-7 h-7" fill={n <= stars ? "#E4F222" : "transparent"} />
                    </button>
                  ))}
                  <span className="ml-2 font-mono-accent text-[10px] uppercase tracking-[0.22em] text-white/50">{stars}/5</span>
                </div>
                <textarea data-testid="review-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="What made this shift great? (optional)" className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none px-4 py-3 text-white placeholder:text-white/30 resize-y" />
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button data-testid="submit-review-modal" onClick={submit} disabled={busy || !otherUser} className="flex-1 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
                {busy ? "Posting…" : "Post review & close"}
              </button>
              <button onClick={onClose} className="px-6 py-4 border border-white/15 hover:border-white/30 font-mono-accent text-xs uppercase tracking-[0.22em]">Skip</button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="mx-auto w-14 h-14 rounded-full grid place-items-center bg-[#E4F222] text-[#08090a] mb-6">
              <CheckCircle2 className="w-7 h-7" />
            </motion.div>
            <h3 className="font-display text-3xl">Review posted.</h3>
            <p className="mt-2 text-white/60">One reputation. One workspace. One movement.</p>
            <button onClick={onClose} data-testid="celebration-done" className="mt-8 bg-white text-[#08090a] px-6 py-3 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-[#E4F222] transition-colors">Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
