import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, setToken } from "@/lib/api";
import { ArrowUpRight, ArrowLeft, Loader2 } from "lucide-react";

const AuthLayout = ({ children, side }) => (
  <div className="min-h-screen bg-transparent text-white grid md:grid-cols-2">
    <div className="hidden md:flex flex-col justify-between p-10 border-r border-white/10 relative overflow-hidden bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-black/35 to-black/75" />
      <div className="relative">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative w-6 h-6 grid place-items-center">
            <span className="absolute inset-0 border border-white/30 rotate-45" />
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </span>
          <span className="font-brand text-lg">SHIFT CHANGE</span>
        </Link>
      </div>
      <div className="relative">
        <p className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/45 mb-3">{side.chapter}</p>
        <h2 className="font-display font-medium text-4xl lg:text-5xl leading-[1.02] tracking-[-0.03em] max-w-md">{side.title}</h2>
      </div>
      <div className="relative font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/35">Simple. Personal. Yours.</div>
    </div>
    <div className="flex flex-col justify-center p-6 md:p-14 max-w-xl w-full mx-auto bg-black/45 backdrop-blur-md">{children}</div>
  </div>
);

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await login(email, pw); nav("/dashboard"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const google = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <AuthLayout side={{ chapter: "Sign in", title: "Welcome back." }}>
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-8">Sign in.</h1>

      <button data-testid="google-signin" onClick={google} className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-white/50 transition-colors px-5 py-3.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] mb-6">
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="font-mono-accent text-[9px] uppercase tracking-[0.3em] text-white/30">or</span><div className="flex-1 h-px bg-white/10" /></div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" testId="login-email" />
        <Field label="Password" value={pw} onChange={setPw} type="password" testId="login-password" />
        {err && <p className="text-[#FF3B30] text-sm font-mono-accent">{err}</p>}
        <button data-testid="login-submit" disabled={busy} className="w-full group flex items-center justify-between gap-6 bg-white disabled:opacity-60 text-black px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white/85 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <>Sign in <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" /></>}
        </button>
      </form>

      <p className="mt-8 text-white/50 text-sm">New here? <Link to="/signup" className="text-white hover:underline">Create an account</Link></p>
    </AuthLayout>
  );
}

export function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (r) => { setRole(r); setStep(2); };

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await signup({ ...form, role }); nav("/dashboard"); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const google = () => {
    localStorage.setItem("sc_signup_role", role || "seeker");
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <AuthLayout side={{ chapter: `Step ${step} of 2`, title: step === 1 ? "Choose how you'll use Shift Change." : "Create your account." }}>
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>

      {step === 1 && (
        <div>
          <p className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/45 mb-3">Step 1</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-8">What do you want to do?</h1>
          <div className="grid gap-3">
            <RoleCard testId="role-earner" title="Earn money" onClick={() => pick("earner")} />
            <RoleCard testId="role-seeker" title="Find help" onClick={() => pick("seeker")} />
            <RoleCard testId="role-both" title="Both" onClick={() => pick("both")} />
          </div>
          <p className="mt-8 text-white/50 text-sm">Have an account? <Link to="/login" className="text-white hover:underline">Sign in</Link></p>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="font-mono-accent text-[10px] uppercase tracking-[0.28em] text-white/45 mb-3">Step 2</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-2">Create your account.</h1>
          <p className="mb-8 text-white/50 text-sm capitalize">{role} · <button onClick={() => setStep(1)} className="underline hover:text-white">change</button></p>

          <button data-testid="google-signup" onClick={google} className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-white/50 transition-colors px-5 py-3.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] mb-6">
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="font-mono-accent text-[9px] uppercase tracking-[0.3em] text-white/30">or</span><div className="flex-1 h-px bg-white/10" /></div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testId="signup-name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" testId="signup-email" />
            <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" testId="signup-password" />
            {err && <p className="text-[#FF3B30] text-sm font-mono-accent">{err}</p>}
            <button data-testid="signup-submit" disabled={busy} className="w-full group flex items-center justify-between gap-6 bg-white disabled:opacity-60 text-black px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white/85 transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <>Continue <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" /></>}
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

export function AuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const done = useRef(false);
  const [err, setErr] = useState("");
  const { refresh } = useAuth();

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = new URLSearchParams(loc.hash.replace(/^#/, ""));
    const sid = hash.get("session_id");
    const role = localStorage.getItem("sc_signup_role") || "seeker";
    localStorage.removeItem("sc_signup_role");
    if (!sid) { nav("/login"); return; }
    (async () => {
      try {
        const r = await api.googleSession({ session_id: sid, role });
        setToken(r.token);
        await refresh();
        nav("/dashboard", { replace: true });
      } catch (e) { setErr(e.message); }
    })();
  }, [loc.hash, nav, refresh]);

  return (
    <div className="min-h-screen bg-transparent text-white grid place-items-center">
      <div className="text-center">
        <div className="font-mono-accent text-xs uppercase tracking-[0.3em] text-white animate-pulse mb-4">Signing in…</div>
        {err && <p className="text-[#FF3B30] font-mono-accent text-sm">{err}</p>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", testId }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <input data-testid={testId} type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="w-full bg-white/[0.04] border border-white/15 focus:border-white/50 focus:outline-none transition-colors px-4 py-3 text-white" />
    </label>
  );
}

function RoleCard({ title, onClick, testId }) {
  return (
    <button onClick={onClick} data-testid={testId} className="group text-left border border-white/15 p-5 md:p-6 hover:border-white/50 hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl md:text-3xl tracking-tight leading-tight">{title}</h3>
        <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:rotate-45 transition-all" />
      </div>
    </button>
  );
}
