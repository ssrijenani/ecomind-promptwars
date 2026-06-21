# EcoMind — A Personal Carbon Footprint Coach

Built for **PromptWars (Hack2skill)** — Challenge 3: *"Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights."*

## Chosen vertical

EcoMind takes the **individual / household sustainability** persona: someone who wants a quick, honest read on their carbon footprint and a few concrete, doable next steps — not a corporate emissions dashboard or an offset marketplace.

## Approach and logic

The product follows a simple loop: **answer → see → understand → act → track.**

1. **Answer** — A short questionnaire covers the four categories that dominate an individual's footprint: commute, diet, home electricity, and air travel.
2. **See** — The backend calculates an estimated monthly footprint in kg CO₂, broken down by category, using published emission factors (see [Methodology](#methodology--assumptions) below). Nothing here is a guess dressed up as data — every factor is sourced.
3. **Understand** — The result is shown against an estimated India per-capita average, so the number means something instead of floating in the abstract.
4. **Act** — This is where the "smart, dynamic assistant" requirement lives: once the footprint is calculated, the frontend sends the user's specific breakdown to Claude (via [Puter.js](https://docs.puter.com), a keyless client-side AI access layer), which returns four tips that reference the user's *actual* numbers (their commute distance, their diet type, their electricity usage) rather than generic eco-advice. The system prompt explicitly requires this so the tips feel personalized, not templated.
5. **Track** — Snapshots are saved to Supabase (scoped to the logged-in user via Row Level Security) so a returning user can see their trend over time, not just a one-off number.

### Why this scope, and what's deliberately left out

Given the build window, the product is intentionally narrow rather than broad: one clean flow, fully tested, instead of many shallow features. Daily activity logging, gamification/streaks, and social or sharing features were considered and explicitly deferred — they would have added significant data-model and UI surface area without strengthening the core "understand and act" loop the challenge asks for.

## How the solution works

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend   │ ───▶ │     Backend       │      │  Puter.js        │
│ React + Vite │ ◀─── │  Node + Express   │      │  (client-side,   │
│  + Puter.js  │ ──────────────────────────────▶ │  keyless Claude  │
│  (AI tips)   │ ◀────────────────────────────── │  access)         │
└──────┬───────┘      └─────────┬─────────┘      └─────────────────┘
       │                        │
       │ Supabase Auth          │ Supabase (Postgres)
       └────────────────────────┴── footprint_snapshots (per-user, RLS-protected)
```

- **Frontend** (`/frontend`): React + Vite. Handles auth UI, the questionnaire, results visualization (Recharts), AI tips (via Puter.js, calling Claude directly from the browser with no API key), and history/trend view.
- **Backend** (`/backend`): Node + Express. Validates input (Zod) and computes the footprint (pure, fully unit-tested functions), then persists snapshots to Supabase using the authenticated user's ID.
- **Database/Auth** (Supabase): Email/password auth; a single `footprint_snapshots` table with Row Level Security so users can only ever read or write their own data.

### Why Puter.js instead of a backend Anthropic API call

The AI tips feature calls Claude through [Puter.js](https://docs.puter.com) directly from the frontend, rather than through a backend endpoint with an Anthropic API key. Puter.js uses a "User-Pays" model: each signed-in Puter user covers their own AI usage, so no API key, billing setup, or server-side AI credentials are required on our end. The trade-off is a one-time, free sign-in prompt the first time a user requests tips — there is no cost and no card required. The footprint calculation itself (the actual carbon math) still happens on the backend, fully validated and unit-tested; only the AI-generated tips are client-side.

## Methodology & assumptions

All emission factors are documented with their source directly in [`backend/src/utils/emissionFactors.js`](./backend/src/utils/emissionFactors.js). In summary:

| Category | Factor | Source basis |
|---|---|---|
| Electricity | 0.71 kg CO₂/kWh | India grid emission factor, consistent with CEA / IEA published estimates for India's coal-heavy generation mix |
| Commute | 0–0.17 kg CO₂/km depending on mode | Standard per-passenger-km estimates (walking/cycling = 0; shared transport lowest; private petrol/diesel vehicles highest) |
| Diet | 1.5–4.9 kg CO₂/day depending on diet type | Consistent with widely cited lifecycle food-emissions research showing diets higher in animal products (especially red meat) have a substantially larger footprint |
| Flights | 250 kg CO₂ (domestic round-trip), 1,100 kg CO₂ (international round-trip) | Approximate per-passenger figures consistent with standard aviation carbon-calculator methodology |
| Comparison baseline | ~1,900 kg CO₂/year per capita (India) | Approximate per-capita figure for context only, not a regulatory benchmark |

**Explicit assumptions:**
- These are estimates for personal awareness, **not** formal carbon accounting, offset calculations, or regulatory reporting.
- Flight emissions are annualized (divided by 12) so a single yearly flight doesn't artificially spike one month's number.
- Commute and diet factors assume average occupancy/portion sizes; we did not attempt granular vehicle-model or food-quantity precision, since the goal is directional awareness, not lab-grade accuracy.
- If the AI call fails for any reason (Puter sign-in declined, network issue, popup blocked), the frontend falls back to safe, still-personalized generic tips based on the user's largest emission category, so the product never breaks.

## Tech stack

- **Frontend:** React, Vite, React Router, Recharts, Supabase JS client, Puter.js (client-side, keyless Claude access)
- **Backend:** Node.js, Express, Zod (validation), Helmet (security headers), express-rate-limit, Supabase JS client (service role)
- **Database/Auth:** Supabase (Postgres + Auth + Row Level Security)
- **AI:** Claude (via Puter.js), `claude-sonnet-4-6`
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Running this project locally

### 1. Supabase setup
1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`backend/sql/schema.sql`](./backend/sql/schema.sql) to create the `footprint_snapshots` table and its RLS policies.
3. From Project Settings → API, copy your Project URL, anon key, and service role key.

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev            # starts on http://localhost:5000
```

Run backend tests:
```bash
npm test
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env   # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev             # starts on http://localhost:5173
```

No Anthropic API key is needed — AI tips run through Puter.js directly in the browser. The first time tips are requested, a free Puter sign-in prompt may appear.

Run frontend tests:
```bash
npm test
```

## Security notes

- The Supabase service role key lives only on the backend; the frontend only ever uses the restricted anon key.
- All API endpoints (except `/api/health`) require a valid Supabase session token, verified server-side on every request.
- Input is validated server-side with an allow-list/range schema (Zod) before touching calculation or database logic.
- Supabase Row Level Security ensures a user can only ever read or write their own snapshots, even if the table were ever queried directly with a client-side key.
- AI tips run through Puter.js's own sign-in/auth model; no Anthropic API key is stored or transmitted by this app at all.

## Accessibility notes

- Visible keyboard focus styling is applied globally.
- Form fields use real `<label>` elements tied to inputs.
- Error and status messages use `role="alert"` / `role="status"` so they're announced to screen readers.
- `prefers-reduced-motion` is respected globally.
- Color choices maintain reasonable contrast against the paper background (deep forest green / charcoal ink on warm cream).

## Known limitations / future scope

- Daily activity logging and streak-based engagement (deferred from this build to protect core quality — see scope note above).
- Region-specific electricity factors (currently a single national India average; state-level grid mix varies).
- Social/comparison features (e.g. comparing with friends or community leaderboards).
