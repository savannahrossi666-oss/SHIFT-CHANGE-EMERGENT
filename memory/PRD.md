# Shift Change — Opportunity Workspace (Beta)

## Original Problem Statements
1. **Manifesto Homepage** — dark cinematic movement-not-marketplace redesign (delivered as v1.0 with Awwwards-caliber craft: Lenis + framer-motion + masked reveals + editorial marquee + FunGames wordmark).
2. **First functional prototype behind homepage** — 5 phases: auth+role dashboards, profiles, create-a-shift, workspaces (chat/tasks/files/timeline/notes/payment), search+recommendations+notifications+wallet+reviews.

## User Choices (Dec 2025 → Beta build)
- Auth: **Both JWT email/password + Emergent Google OAuth**
- Payments: Real Stripe requested → **MOCKED for beta** (Stripe playbook + keys are the follow-up)
- Real-time: **WebSockets** (FastAPI native `/api/ws/{token}`)
- File uploads: Real cloud storage requested → **base64-in-Mongo for beta** (S3/GCS is the follow-up)

## Architecture

**Backend** (`/app/backend/server.py` — single file, ~620 lines, 5 domains)
- Auth: `/api/auth/{signup, login, google/session, me, logout}` — JWT + Emergent session token co-exist via unified `current_user` dep
- Profile: `PATCH /api/profile` + `GET /api/users/{id}` (public view — no email/wallet)
- Shifts: `POST/GET /api/shifts`, `GET /api/shifts/{id}`, `POST /api/shifts/{id}/action` (accept/complete/cancel)
- Workspaces: `GET /api/workspaces`, `GET /api/workspaces/{id}`, `POST messages/tasks/files/pay`, `PATCH tasks/{id}, /notes`
- Reviews: `POST/GET /api/reviews/{user_id}` with auto rating recalc via aggregation
- Notifications: `GET /api/notifications`, `POST /api/notifications/read` + `notify()` helper broadcasts via WS
- Recommendations: `GET /api/recommendations` — matches on skills/services tags
- Wallet: `GET /api/wallet` (MOCKED balance)
- WebSocket: `@app.websocket("/api/ws/{token}")` — join_room broadcasts messages/tasks/files/notifications

**Frontend** (React 19 + Tailwind + framer-motion + Lenis)
- `/app/frontend/src/lib/api.js` — API client, Bearer token from `localStorage.sc_token`
- `/app/frontend/src/lib/auth.jsx` — `AuthProvider` + `useAuth`
- `/app/frontend/src/app/AppShell.jsx` — sticky sidebar + top search bar, shared by all app routes
- `AuthPages.jsx` — Login, Signup (2-step: role pick → account), AuthCallback (Google `#session_id=…`)
- `Dashboard.jsx` — role-personalized headline, 4 stat cards, workspaces + recommendations + shifts sections
- `Profile.jsx` — chip editors for skills/services/products/equipment, portfolio, photo upload (base64), reviews on public view
- `Shifts.jsx` — list (filter/search), create wizard (6 kinds), detail with accept/complete/cancel
- `Workspace.jsx` — 6 tabs (chat/tasks/files/timeline/notes/payment), WebSocket real-time
- `MiscPages.jsx` — Notifications, Wallet (MOCKED disclaimer)

## Routes
- `/` — manifesto (public)
- `/login`, `/signup` — auth
- `/dashboard`, `/profile`, `/u/:userId` (public profile view)
- `/shifts`, `/shifts/mine`, `/shifts/new`, `/shifts/:id`
- `/workspaces`, `/workspace/:id`
- `/notifications`, `/wallet`

## Implemented (Dec 2025 — Beta v1.0)
Phase 1 ✓ Auth (JWT + Google) with role signup + role-personalized dashboards
Phase 2 ✓ Profiles: photo, bio, chip editors (skills/services/products/equipment), portfolio, verified badge, rating, reviews
Phase 3 ✓ Create-a-Shift: 6 kinds (service/gig/consultation/rental/product/custom) + tags + delivery mode
Phase 4 ✓ Workspaces auto-created on accept; 6 tabs: chat (WS real-time), tasks (add/toggle), files (upload/download), timeline (auto events), notes (shared), payment (MOCKED Stripe)
Phase 5 ✓ Global search (top bar → /shifts?q=), recommendations (skill-tag match, fallback to latest), notifications page + WS push, wallet UI (MOCKED balance), reviews with auto rating recalc

## Testing
- iteration_2.json: **24/24 backend pytest passing, 100% frontend flows** — no functional bugs. Test suite lives at `/app/backend/tests/backend_test.py`.
- Test users: `alice+earn@test.sc` / `pw12345` (earner), `bob+seek@test.sc` / `pw12345` (seeker) — see `/app/memory/test_credentials.md`.

## Backlog (P0/P1/P2)
- **P0 — Real Stripe integration** (needs playbook via `integration_playbook_expert_v2` + Stripe test key + wire to `/api/workspaces/{id}/pay` and wallet balance)
- **P0 — Real cloud storage** for files/photos (S3 or similar; replace base64 endpoint)
- **P1 — WebSocket routing at ingress** (may require verifying `/api/ws/*` path is proxied for WSS; current `wss://…/api/ws/{token}` should work through the Emergent ingress)
- **P1 — Verified badges** (KYC/manual admin toggle)
- **P1 — Shift image / cover uploads**
- **P2 — Server-side file size cap** on upload endpoint (currently unbounded base64)
- **P2 — Refactor `server.py` into routers** as domains grow (auth, shifts, workspaces, misc)
- **P2 — Dead-socket pruning** in WSManager on send failure
- **P2 — Notifications: mark individual read**, push web notifications, email digest
- **P2 — Search: full-text index + Meilisearch/Atlas Search** for scale
