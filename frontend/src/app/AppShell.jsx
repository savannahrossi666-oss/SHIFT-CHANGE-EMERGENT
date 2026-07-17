import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, UserCircle2, Briefcase, Compass, Wallet, Bell,
  MessagesSquare, LogOut, Plus, Search,
} from "lucide-react";

export function AppShell({ children }) {
  const { user, logout, loading } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090a] text-white grid place-items-center">
        <div className="font-mono-accent text-xs uppercase tracking-[0.3em] text-white/50 animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  const nlink = (to, label, Icon) => {
    const active = loc.pathname === to || (to !== "/dashboard" && loc.pathname.startsWith(to));
    return (
      <Link
        to={to}
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
        className={`group flex items-center gap-3 px-4 py-3 border-l-2 transition-colors ${
          active ? "border-[#E4F222] bg-white/[0.03] text-white" : "border-transparent text-white/60 hover:text-white hover:bg-white/[0.02]"
        }`}
      >
        <Icon className="w-4 h-4" strokeWidth={1.5} />
        <span className="font-mono-accent text-[11px] uppercase tracking-[0.2em]">{label}</span>
      </Link>
    );
  };

  const onSearch = (e) => {
    e.preventDefault();
    nav(`/shifts?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#08090a] text-white flex" data-testid="app-shell">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-white/10 bg-[#0a0b0c] sticky top-0 h-screen">
        <Link to="/dashboard" className="flex items-center gap-3 px-6 py-6 border-b border-white/10 group">
          <span className="relative w-6 h-6 grid place-items-center shrink-0">
            <span className="absolute inset-0 border border-white/30 rotate-45 group-hover:rotate-[135deg] transition-transform duration-700" />
            <span className="w-1.5 h-1.5 bg-[#E4F222] rounded-full" />
          </span>
          <span className="font-brand text-lg tracking-normal text-white">SHIFT CHANGE</span>
        </Link>
        <nav className="flex-1 py-4">
          {nlink("/dashboard", "Dashboard", LayoutDashboard)}
          {nlink("/profile", "Profile", UserCircle2)}
          {nlink("/shifts", "Browse", Compass)}
          {nlink("/shifts/mine", "My Shifts", Briefcase)}
          {nlink("/workspaces", "Workspaces", MessagesSquare)}
          {nlink("/wallet", "Wallet", Wallet)}
          {nlink("/notifications", "Notifications", Bell)}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link to="/shifts/new" data-testid="sidebar-create-shift" className="mb-4 group flex items-center justify-between gap-2 bg-[#E4F222] text-[#08090a] px-4 py-3 font-mono-accent text-[11px] uppercase tracking-[0.22em] font-semibold hover:bg-white transition-colors">
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Create a Shift</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 grid place-items-center overflow-hidden shrink-0">
              {user.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> :
                <span className="font-brand text-sm">{(user.name || "?")[0]?.toUpperCase()}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user.name}</div>
              <div className="font-mono-accent text-[9px] uppercase tracking-[0.2em] text-[#E4F222]">{user.role}</div>
            </div>
            <button onClick={() => { logout(); nav("/"); }} data-testid="nav-logout" className="text-white/50 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-[#08090a]/85 backdrop-blur-xl border-b border-white/10 px-6 md:px-10 h-16 flex items-center gap-4">
          <form onSubmit={onSearch} className="flex-1 max-w-xl flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-white/20 focus-within:border-[#E4F222] transition-colors px-4 py-2.5">
            <Search className="w-4 h-4 text-white/40" />
            <input
              data-testid="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shifts, skills, services…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30"
            />
            <span className="hidden sm:inline font-mono-accent text-[10px] uppercase tracking-[0.2em] text-white/30">↵</span>
          </form>
          <Link to="/notifications" data-testid="header-notifications" className="w-9 h-9 grid place-items-center border border-white/10 hover:border-[#E4F222] transition-colors">
            <Bell className="w-4 h-4" />
          </Link>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ chapter, title, subtitle, actions }) {
  return (
    <div className="px-6 md:px-10 py-10 md:py-14 border-b border-white/10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="min-w-0">
          {chapter && <p className="font-mono-accent text-[11px] uppercase tracking-[0.3em] text-[#E4F222] mb-4">{chapter}</p>}
          <h1 className="font-display font-medium text-white text-4xl md:text-5xl leading-[1.02] tracking-[-0.03em]">{title}</h1>
          {subtitle && <p className="mt-3 text-white/60 text-base md:text-lg font-light max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
