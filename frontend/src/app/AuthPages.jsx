import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, setToken } from "@/lib/api";
import { ArrowUpRight, ArrowLeft, Loader2 } from "lucide-react";

const AuthLayout = ({ children, side }) => (
  <div className="min-h-screen bg-[#08090a] text-white grid md:grid-cols-2">
    <div className="hidden md:flex flex-col justify-between p-10 border-r border-white/10 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center grayscale"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1634021086770-12b626224f7a?auto=format&fit=crop&w=1600&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#08090a]/70 to-[#08090a]/95" />
      <div className="relative">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative w-6 h-6 grid place-items-center">
            <span className="absolute inset-0 border border-white/30 rotate-45" />
            <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full" />
          </span>
          <span className="font-brand text-lg">SHIFT CHANGE</span>
        </Link>
      </div>
      <div className="relative">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-4">{side.chapter}</p>
        <h2 className="font-display font-medium text-3xl lg:text-5xl leading-[1.02] tracking-[-0.03em] max-w-md">{side.title}</h2>
        <p className="mt-6 text-white/60 max-w-md">{side.subtitle}</p>
      </div>
      <div className="relative font-mono-accent text-[10px] uppercase tracking-[0.3em] text-white/40">
        Movement · not a marketplace
      </div>
    </div>
    <div className="flex flex-col justify-center p-6 md:p-14 max-w-xl w-full mx-auto">{children}</div>
  </div>
);

// ------------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------------
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
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <AuthLayout side={{ chapter: "Log in", title: "Welcome back to the workspace.", subtitle: "Your opportunity queue is warm. Pick up where you left off." }}>
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>
      <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-3">Sign in</p>
      <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-10">Enter the workspace.</h1>

      <button data-testid="google-signin" onClick={google} className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-[#E4F222] hover:text-[#E4F222] transition-colors px-5 py-3.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] mb-6">
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="font-mono-accent text-[9px] uppercase tracking-[0.3em] text-white/30">or with email</span><div className="flex-1 h-px bg-white/10" /></div>

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" value={email} onChange={setEmail} type="email" testId="login-email" />
        <Field label="Password" value={pw} onChange={setPw} type="password" testId="login-password" />
        {err && <p className="text-[#FF3B30] text-sm font-mono-accent">{err}</p>}
        <button data-testid="login-submit" disabled={busy} className="w-full group flex items-center justify-between gap-6 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <>Sign in <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" /></>}
        </button>
      </form>

      <p className="mt-8 text-white/50 text-sm">
        New here? <Link to="/signup" className="text-[#E4F222] hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
}

// ------------------------------------------------------------------
// SIGNUP
// ------------------------------------------------------------------
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
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <AuthLayout side={{
      chapter: `Sign up · Step ${step} of 2`,
      title: step === 1 ? "First, pick your side." : role === "earner" ? "You've chosen to earn." : "You've chosen to hire.",
      subtitle: step === 1 ? "You can switch, or use both — this just sets your starting workspace." : "One workspace. One profile. One reputation. Let's get you set up.",
    }}>
      <Link to="/" className="mb-10 inline-flex items-center gap-2 font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </Link>

      {step === 1 && (
        <div>
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-3">Create account · Step 1</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-10">
            What brings you<br />to Shift Change?
          </h1>
          <div className="grid gap-4">
            <RoleCard testId="role-earner" title="I Want to Earn Money" body="Turn your skills, tools, hours or products into income. Photography, tutoring, moving, editing, coding — anything valuable." onClick={() => pick("earner")} accent />
            <RoleCard testId="role-seeker" title="I Need Help" body="Find trusted people for everyday work, one workspace instead of a dozen sites. From a logo to a lawn to a ride." onClick={() => pick("seeker")} />
            <RoleCard testId="role-both" title="Both — I'll earn and hire" body="Best of both. Your profile stays the same either way." onClick={() => pick("both")} subtle />
          </div>
          <p className="mt-8 text-white/50 text-sm">Already have an account? <Link to="/login" className="text-[#E4F222] hover:underline">Sign in</Link></p>
        </div>
      )}

      {step === 2 && (
        <div>
          <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-3">Create account · Step 2</p>
          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em] mb-2">
            Almost there.
          </h1>
          <p className="mb-8 text-white/50 text-sm">Role: <span className="text-[#E4F222] font-mono-accent uppercase tracking-[0.2em]">{role}</span> · <button onClick={() => setStep(1)} className="underline hover:text-white">change</button></p>

          <button data-testid="google-signup" onClick={google} className="w-full flex items-center justify-center gap-3 border border-white/20 hover:border-[#E4F222] hover:text-[#E4F222] transition-colors px-5 py-3.5 font-mono-accent text-[11px] uppercase tracking-[0.22em] mb-6">
            Sign up with Google
          </button>

          <div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="font-mono-accent text-[9px] uppercase tracking-[0.3em] text-white/30">or with email</span><div className="flex-1 h-px bg-white/10" /></div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} testId="signup-name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" testId="signup-email" />
            <Field label="Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" testId="signup-password" />
            {err && <p className="text-[#FF3B30] text-sm font-mono-accent">{err}</p>}
            <button data-testid="signup-submit" disabled={busy} className="w-full group flex items-center justify-between gap-6 bg-[#E4F222] disabled:opacity-60 text-[#08090a] px-6 py-4 font-mono-accent text-xs uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <>Create account <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" /></>}
            </button>
          </form>
        </div>
      )}
    </AuthLayout>
  );
}

// ------------------------------------------------------------------
// GOOGLE CALLBACK
// ------------------------------------------------------------------
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
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-[#08090a] text-white grid place-items-center">
      <div className="text-center">
        <div className="font-mono-accent text-xs uppercase tracking-[0.3em] text-[#E4F222] animate-pulse mb-4">Establishing session…</div>
        {err && <p className="text-[#FF3B30] font-mono-accent text-sm">{err}</p>}
      </div>
    </div>
  );
}

// ---- helpers ----
function Field({ label, value, onChange, type = "text", testId }) {
  return (
    <label className="block">
      <span className="block font-mono-accent text-[10px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</span>
      <input
        data-testid={testId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full bg-white/[0.03] border border-white/15 focus:border-[#E4F222] focus:outline-none transition-colors px-4 py-3 text-white placeholder:text-white/30"
      />
    </label>
  );
}

function RoleCard({ title, body, onClick, accent, subtle, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`group text-left border p-6 md:p-7 transition-colors ${
        accent ? "border-[#E4F222]/50 bg-[#E4F222]/[0.04] hover:bg-[#E4F222]/[0.08]" :
        subtle ? "border-white/10 hover:border-white/25" : "border-white/15 hover:border-[#E4F222]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-2xl md:text-3xl tracking-tight leading-tight">{title}</h3>
        <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-[#E4F222] group-hover:rotate-45 transition-all" />
      </div>
      <p className="mt-3 text-white/60 text-sm md:text-base font-light">{body}</p>
    </button>
  );
}
