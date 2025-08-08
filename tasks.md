## Drink Production Scheduler — Full‑stack plan (Vercel compatible)

The goal is to ship a Next.js + TypeScript app deployed to Vercel that ingests `CIP Combined.xlsx`, lets users choose a production line and drinks (or upload a list), runs a Held–Karp optimization to minimize water usage, and exports the resulting schedule. No code is written yet—this file enumerates tasks, acceptance criteria, and API contracts.

### Tech Stack

- Next.js (App Router, TypeScript, strict)
- UI: Tailwind CSS + Headless UI (or shadcn/ui)
- Data fetching: TanStack Query
- Validation: Zod
- Excel parsing: `xlsx` (SheetJS)
- Testing: Vitest + React Testing Library; Playwright for basic e2e
- Deployment target: Vercel (Serverless Node functions)

---

### Phase 1 — Project setup

- [ ] Create Next.js app with TypeScript, App Router, ESLint/Prettier, Tailwind
  - Acceptance: `pnpm dev` runs; `/` renders a placeholder page on localhost
- [ ] Add repo structure
  - `app/` (routes), `components/`, `lib/`, `server/`, `data/`, `tests/`, `public/`
- [ ] Move `CIP Combined.xlsx` to `data/CIP Combined.xlsx`
- [ ] Add strict TypeScript config (noImplicitAny, strictNullChecks, exactOptionalPropertyTypes)
- [ ] Configure absolute imports/paths alias (`@/lib`, `@/components`)

### Phase 2 — Data ingestion (Excel)

- [ ] Implement a server-side Excel loader for Vercel
  - Use `xlsx` to read `data/CIP Combined.xlsx`
  - Build a typed model: production lines → drinks table for that sheet
  - Normalize/trim headers and values; map cleaning processes to numeric values
  - Default unknown/missing costs to `8000` (as in original script)
  - Cache workbook in-memory per invocation; add simple revalidation (e.g., 24h)
  - Acceptance: API can list lines and drinks for a specific line without UI

### Phase 3 — Algorithm (TypeScript port)

- [ ] Port Held–Karp dynamic programming solver to TypeScript
  - Inputs: adjacency matrix, ordered drinks list
  - Outputs: `{ cost, path }` where `path` is drink names in optimal order
- [ ] Implement `waterUsed(order)` that sums edge costs per consecutive pair from Excel-derived matrix
- [ ] Implement graph/matrix builder from requested drinks subset
- [ ] Optimize: iterate different starting nodes and take global minimum (parity with script)
- [ ] Guardrails for set sizes (e.g., >18 drinks warns about time/limits)
  - Acceptance: Deterministic results on small fixtures; unit tests cover core cases

### Phase 4 — API layer (Serverless routes)

- [ ] GET `/api/lines`
  - Response: list of available lines (e.g., `[1,2,5,6,7,8,9,10,11]`)
- [ ] GET `/api/drinks?line=NUMBER`
  - Response: `{ line: number, drinks: string[] }`
- [ ] POST `/api/optimize`
  - Request JSON:
    ```json
    {
      "line": 1,
      "drinks": ["Drink A", "Drink B", "Drink C"],
      "initialSchedule": ["Drink B", "Drink A", "Drink C"]
    }
    ```
    - `initialSchedule` is optional; if provided, compute water saved vs. that order; otherwise compare against the input order as entered
  - Response JSON:
    ```json
    {
      "line": 1,
      "optimalSchedule": ["Drink A", "Drink C", "Drink B"],
      "totalWaterGallons": 1234.56,
      "savedWaterGallons": 789.01
    }
    ```
- [ ] POST `/api/parse-drinks-upload` (optional)
  - Accepts text/CSV file; returns `{ drinks: string[] }` (client may also parse locally)
- [ ] GET `/api/export?line=1&drinks=...` (optional)
  - Returns CSV of schedule and metrics for download
- Acceptance: All endpoints include Zod validation and consistent error shapes

### Phase 5 — UI/UX (per screenshot)

- [ ] App shell with header: title + Reset + Export buttons
- [ ] Left column panels
  - Select Production Line (dropdown; loads lines; required)
  - Select Drinks
    - Multi-select from available drinks (filtered by line)
    - Or upload text/CSV list (newline or comma-separated)
  - Status card
    - Selected line, number of drinks, readiness state
  - Run Optimization panel
    - Disabled until a line and ≥2 unique drinks selected
    - On run: loading state, then show results
- [ ] Main panel: Production Schedule
  - Empty state illustration; then show ordered list with totals and saved water
- [ ] UX details
  - Persist selections in URL query for shareability
  - Form validation errors inline
  - Keyboard and screen-reader accessible controls
- Acceptance: Visual parity with screenshot; responsive layout; dark mode support

### Phase 6 — Validation, errors, and edge cases

- [ ] Sanitize uploaded drink names; trim/case-normalize matches
- [ ] Warn on unknown drinks (offer to exclude or show mapping errors)
- [ ] De-duplicate drinks; preserve chosen order for baseline comparison
- [ ] Limit max set size with helpful message when too large
- [ ] Clear, typed error responses for all API routes

### Phase 7 — Testing

- [ ] Unit: algorithm (matrix build, waterUsed, heldKarp, start-node min)
- [ ] Unit: Excel parsing utilities (headers, whitespace, mapping defaults)
- [ ] Component tests: line select, drinks selector, run button states
- [ ] e2e: happy path from selection → optimize → export

### Phase 8 — Performance and reliability

- [ ] Lazy-load Excel only when needed; cache per serverless container
- [ ] Stream CSV export
- [ ] Guard against exceedingly large uploads
- [ ] Basic request logging and timing (console or lightweight logger)

### Phase 9 — Security & compliance

- [ ] Validate all inputs with Zod on server
- [ ] Limit payload sizes; reject binary uploads except expected text/CSV
- [ ] No PII; ensure headers in Excel are treated as static data

### Phase 10 — Deployment to Vercel

- [ ] Add `vercel.json` (optional) and project settings
- [ ] Ensure Node serverless runtime (not edge) for `xlsx`
- [ ] Environment config: none required by default
- [ ] Upload and verify production build; sanity-check APIs

### Phase 11 — Documentation

- [ ] README with setup, scripts, API docs, and deployment steps
- [ ] Short architecture note explaining matrix construction and DP complexity

---

### Milestones & Deliverables

- M1: Backend data ingestion + lines/drinks APIs
- M2: Algorithm port with unit tests
- M3: UI skeleton wired to APIs
- M4: Export + polish (a11y, dark mode, error states)
- M5: Vercel deployment

### Open Questions

- What is the official baseline schedule for “water saved”? Defaulting to the user-provided initial order; confirm if another baseline is needed.
- Maximum expected number of drinks per run (to tune limits and UX warnings)?
