# Shift Change — Opportunity Workspace (Homepage Manifesto)

## Original Problem Statement
Shift Change is no longer being positioned as a gig marketplace or job board. It is an **opportunity workspace** built around one belief: *People already have value. They just don't have the infrastructure to turn that value into income.*

Completely redesign the homepage messaging to communicate this mission. Award-worthy, Awwwards Site-of-the-Day level — bold, cohesive, kinetic. Framer-motion + Lenis, editorial marquee, parallax hero, numbered manifesto chapters. **No backend changes** (no payments, dashboards, DB).

## User Choices (Dec 2025)
- Keep existing nav/footer — only rewrite homepage content sections (built minimal cinematic nav + footer since template had none)
- Hero background video: `/webpage.mp4` (graceful poster fallback if missing)
- CTAs scroll to sections only (no auth flow yet)
- Fonts: designer's call → Clash Display (display) + Instrument Serif italic (accent) + Manrope (body) + JetBrains Mono (labels)

## Architecture
- **Frontend only**: React 19 + CRA/Craco + Tailwind + framer-motion + Lenis + react-fast-marquee + lucide-react
- No backend/API changes; server.py untouched
- Route: `/` → `Home` (single long-scroll manifesto page)

## Persona
Anyone with an untapped skill, tool, hobby, or hour who wants to turn value into income — AND anyone who needs affordable everyday help without hopping across a dozen freelance sites.

## Implemented (Dec 2025 — v1.0)
Cinematic manifesto homepage with 8 sections:
1. **Nav** — fixed, glassmorphism on scroll, neon-lime CTA
2. **Hero** — /webpage.mp4 bg + parallax zoom, masked line-by-line reveal ("Stop looking for work. Start creating *opportunity.*"), dual CTAs, live ticker marquee, chapter label
3. **Ch. 01 Problem** — hairline grid, sticky chapter label, oversized display headline, dual-column diagnosis
4. **Ch. 02 The Shift** — slow editorial outline marquee ("OPPORTUNITY WORKSPACE"), scroll-linked strikethrough of "Who's hiring?" transitioning to giant "What can I *offer* today?"
5. **Ch. 03 Split Cards** — mouse-following spotlight, clipped photography, "I want to *earn*" (2-column skill list) + "I need *help*" (numbered needs list)
6. **Ch. 04 Manifesto** — 5 lettered chapters (i–v), roman numerals, giant text with serif italic emphasis
7. **Ch. 05 Transformation** — Old Way (grayscale, strikethrough, DEPRECATED) → arrow → Shift Change (neon lime glow, NOW LIVE)
8. **Ch. 06 Closing** — scale-down "Opportunity is *already* around you" + kinetic word list with blur-in stagger + dual CTAs
9. **Footer** — 4-column, chapter navigation, tagline

## Motion
- Lenis smooth momentum scrolling (custom hook, anchor-tag hijack)
- Framer-motion scroll-linked parallax on hero video (scale + Y)
- Scroll-linked crossfade of Shift section headlines
- Masked line-by-line reveal on hero on mount
- `Rise` component for scroll-into-view fade+translateY on every content block
- One slow editorial marquee (18 speed, outline-only text)

## Design System
- Palette: Pitch Black `#08090a` bg / Porcelain `#f7f8f8` text / Neon Lime `#E4F222` accent / Danger `#FF3B30`
- Type: Clash Display (Fontshare) + Instrument Serif italic + Manrope + JetBrains Mono
- Sharp corners only (rounded-none), 1px hairline borders, 4px grid
- Grain overlay, hairline grid utility, radial fade masks

## Testing
- iteration_1.json: 14 checks passed, 0 failed, 100% success — all 16 data-testids present, zero console errors, all CTAs scroll to `#audiences`.

## Backlog (P0/P1/P2)
- **P0**: Add real `webpage.mp4` file to `/app/frontend/public/` (currently gracefully falls back to poster)
- **P1**: Wire CTAs to real auth/onboarding flow when auth is built
- **P1**: `/create-listing` and `/browse` routes for actual workspace
- **P2**: Add "Skill valuation" interactive widget on hero (calc estimated earnings from a chosen skill)
- **P2**: SEO metadata + OG image
- **P2**: Motion-reduced fallbacks (currently respected via `prefers-reduced-motion` CSS)
