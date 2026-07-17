const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

const TOKEN_KEY = "sc_token";

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let msg = "Request failed";
    try { const j = await res.json(); msg = j.detail || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  signup: (b) => req("/auth/signup", { method: "POST", body: JSON.stringify(b) }),
  login: (b) => req("/auth/login", { method: "POST", body: JSON.stringify(b) }),
  googleSession: (b) => req("/auth/google/session", { method: "POST", body: JSON.stringify(b) }),
  me: () => req("/auth/me"),
  logout: () => req("/auth/logout", { method: "POST" }),
  updateProfile: (b) => req("/profile", { method: "PATCH", body: JSON.stringify(b) }),
  getUser: (id) => req(`/users/${id}`),
  createShift: (b) => req("/shifts", { method: "POST", body: JSON.stringify(b) }),
  listShifts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req(`/shifts${q ? "?" + q : ""}`);
  },
  getShift: (id) => req(`/shifts/${id}`),
  actionShift: (id, action) => req(`/shifts/${id}/action`, { method: "POST", body: JSON.stringify({ action }) }),
  myWorkspaces: () => req("/workspaces"),
  getWorkspace: (id) => req(`/workspaces/${id}`),
  sendMessage: (id, text) => req(`/workspaces/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  addTask: (id, title) => req(`/workspaces/${id}/tasks`, { method: "POST", body: JSON.stringify({ title }) }),
  toggleTask: (wid, tid, done) => req(`/workspaces/${wid}/tasks/${tid}`, { method: "PATCH", body: JSON.stringify({ done }) }),
  updateNotes: (id, notes) => req(`/workspaces/${id}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }),
  uploadFile: (id, file) => req(`/workspaces/${id}/files`, { method: "POST", body: JSON.stringify(file) }),
  getFile: (wid, fid) => req(`/workspaces/${wid}/files/${fid}`),
  pay: (id, cardDetails) => req(`/workspaces/${id}/pay`, { method: "POST", body: JSON.stringify(cardDetails || {}) }),
  getReceipt: (id) => req(`/workspaces/${id}/receipt`),
  notifications: () => req("/notifications"),
  markRead: () => req("/notifications/read", { method: "POST" }),
  recommendations: () => req("/recommendations"),
  wallet: () => req("/wallet"),
  reviews: (id) => req(`/reviews/${id}`),
  leaveReview: (id, b) => req(`/reviews/${id}`, { method: "POST", body: JSON.stringify(b) }),
  wsUrl: () => {
    const token = getToken();
    const u = new URL(BASE);
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.host}/api/ws/${token}`;
  },
};
