# Travel & Aviation Agency ERP — MERN Rebuild Roadmap

> Companion document: **`02_TECHNICAL_SPEC.md`** (data models, API contracts, business-logic algorithms, frontend architecture). Read this file first for the *what and why*, then use the spec for the *exact how*.

## 0. Ground rules for this rebuild

- **Not hardcoded to one agency.** Every place the current prototype hardcodes "SYED AVIATION," a logo, or a Firebase project, the new app reads it from a `Settings` record in the database, editable from the UI. "Syed Aviation" ships only as the **default seed value** for that settings record — rename it, and the whole app rebrands. Treat this as if you were building a sellable product, not a one-off script for a single business.
- **Standard MERN project layout.** Two independent, top-level folders — `frontend/` and `backend/` — each with its own `package.json`, own dependency tree, own `.env`. No mixing of client and server code in one folder, no globals, no `<script>`-tag includes. This mirrors how virtually every real-world MERN codebase is organized, which also means Antigravity (and any future developer) will recognize the layout instantly.
- **No payment gateway work.** Client "receipts" stay what they already are in the prototype: a manual record of *how* money came in (cash / bank / mobile transfer / card) — a bookkeeping entry, not a live payment integration. Do not add bKash/Nagad/SSLCommerz/Stripe checkout flows.
- **Recommended language: TypeScript, both ends.** This is a ledger app — a wrong type flowing into a money calculation is a real financial bug, not a cosmetic one. TypeScript catches a large class of these at build time and gives Antigravity/Gemini a much stronger contract to work against (it can't "forget" what a `Transaction` looks like the way it can in plain JS). Plain JavaScript will also work if you'd rather move faster and skip the type layer — the spec notes where TS earns its keep most (the balance-update service functions).

---

## 1. What the current prototype actually does (feature audit)

The uploaded `index.html` / `app.js` / `style.css` / `config.txt` describe a single-page, single-user, Firebase-Firestore-backed ledger book. Reading the code line by line, here's the complete feature inventory:

| Feature | How it currently works | Verdict for the rebuild |
|---|---|---|
| **Dashboard** | 4 stat cards (Total Client Due, Portal Wallet total, Agency Due total, All-Time Profit) computed by looping over every transaction in browser memory; a date-range filter recomputes filtered profit client-side | Keep the UX, move the math to a MongoDB aggregation on the server |
| **Issue Tickets (invoice)** | Multi-passenger form (name, ticket no, PNR, airline, route, cost, sell); picks a Client and a Supplier; auto totals cost/sell/profit; quick-add Client and Airline inline | Keep as-is, harden the server-side math |
| **Visa** | Same pattern as tickets but per-passenger fields are Visa No + Sector instead of Ticket/PNR/Airline/Route; supplier restricted to Agency or the in-house "SELF" supplier | Keep as-is |
| **Receipts** | Records a client payment (Cash/Bank/Mobile/Card + amount + remarks), reduces the client's due, optional immediate print | Keep as-is |
| **Ledger** | One unified, searchable, sortable, filterable table of every transaction type, click-to-edit, per-row delete | Keep the UX; move search/sort/filter/pagination server-side (currently everything is loaded into memory at once, which won't scale) |
| **Portals & Agencies (Suppliers)** | Two supplier types — **Portal** (a prepaid wallet/BSP-style balance; deposits top it up, ticket/visa costs draw it down) and **Agency** (a running payable; payments reduce it, ticket/visa costs increase it) — plus a hidden **"SELF"** supplier representing in-house/own stock with no balance tracking at all | Keep the accounting model exactly — it's a correct, if informally implemented, mini double-entry system. Formalize it (see §4) |
| **Reports** | Client Statement, Supplier Statement, Ticket Profit report, Visa Profit report — all built as an HTML string and pushed into a new browser tab for the user to `Ctrl+P` "as PDF" | Keep all four report types; generate *real* PDFs server-side instead of relying on the browser's print dialog |
| **Money receipt voucher** | A printable receipt with the amount spelled out in words, using **Bangladeshi Lakh/Crore numbering** (`numberToWords`), not the Western thousand/million system | Preserve this exactly — it's a nice, locale-correct touch and it's easy to lose by accident during a rewrite |
| **Settings** | Terminal name and logo stored in **`localStorage`** (per browser, per device — never synced), plus a "Factory Reset" button that wipes the whole Firestore database | Logo/company info becomes one shared `Settings` record in the database, visible identically on every device. Factory reset becomes an admin-only, confirmation-gated maintenance action |
| **"Online/Offline" badge** | Cosmetic only — the app is unusable when Firestore is unreachable; there is no real offline queue | Rebuild as a real network-status indicator; no offline write queue in v1 (flag as a possible future PWA feature, not required now) |

### The three problems that matter most and why this rebuild fixes them

1. **The database has no lock on the front door.** `config.txt` is a Firebase Web API key and project ID shipped straight to the browser, with nothing in the code enforcing who can read or write. Anyone who opens dev tools can see the credentials and, if Firestore security rules aren't independently locked down, can read or overwrite the entire ledger. A Node/Express backend fixes this structurally: the database connection string lives only in a server-side `.env` file that never reaches a browser, and every write is authenticated and authorized before it happens.
2. **The supplier `balance` field can drift from the truth.** It's a single mutable number, hand-adjusted by JavaScript that reverses an old effect and reapplies a new one on every edit — correct in principle, but two `saveData()` calls that aren't wrapped in anything atomic. If a browser tab closes mid-edit, or two staff members edit related records at the same moment, the number and reality can quietly disagree, and there is no way to tell. §4 below fixes this with database transactions and a "recalculate from source" safety net.
3. **There is no concept of a user.** One shared, unauthenticated view for the whole business, no record of who issued which ticket, no audit trail, and destructive actions (delete, factory reset) have no confirmation beyond a JS `confirm()` popup. For anything handling real money this is the highest-priority gap.

---

## 2. Recommended new / improved features

Split into what you need to reach a trustworthy replacement (Phase 1–2 territory) and genuinely new capability (Phase 3+, optional and modular — build only the pieces that match how this agency actually operates).

### 2.1 Foundational improvements (build these — they're fixes, not extras)

| Feature | Why |
|---|---|
| **User accounts + roles** (Admin / Manager-Accounts / Counter-Staff) | Replaces the single shared, unauthenticated screen; every transaction is attributed to a real person |
| **Audit log** | Every create/edit/void writes an entry (who, what, when, before → after). Non-negotiable once real money is involved |
| **Void instead of hard-delete for financial records** | The prototype's `deleteTransaction()` permanently erases history. A ledger should never lose a record of what happened — mark it `VOIDED` with a reason instead, keep it visible (filterable), and only let Admins truly hard-delete same-day mistakes |
| **Server-computed, transaction-safe balances** | Wrap every money-affecting write in a MongoDB session transaction that updates the `Transaction` doc and the related `Client`/`Supplier` cached balance together, atomically — see §4. Add an admin-only "Recalculate Balances" endpoint that rebuilds every cached balance from the full transaction history, as a drift-proof safety net |
| **Real PDF generation** | Replace `window.open()` + browser print with server-rendered PDFs (Puppeteer), so statements/receipts look identical regardless of what's printing them, and can be emailed or archived |
| **Atomic, gapless reference numbers** | Replace `Date.now()`-derived refs with a MongoDB counter collection (`INVT-2026-000123` style) — see §4 |

### 2.2 Genuinely new capability (pick what fits — each is independently buildable)

| Feature | Why it fits a travel/aviation agency |
|---|---|
| **Refund / reissue workflow** | Completely missing today. Every ticketing business deals constantly with cancellations, partial refunds, and reissues; right now the only option is to delete and re-enter, which destroys the audit trail. Model refunds/reissues as their own transaction type linked back to the original invoice |
| **ADM/ACM tracking** | Airlines issue Agency Debit Memos and Agency Credit Memos against agencies after BSP reconciliation (fare/tax discrepancies, commission clawbacks, etc.). Add these as their own supplier-transaction subtypes so they're distinguishable from ordinary deposits/payments in a supplier statement |
| **Client aging report** | Standard accounts-receivable view — outstanding client dues bucketed 0–30 / 31–60 / 61–90 / 90+ days. Cheap to build once transactions live in a real database and very useful for collections |
| **Agency credit limit + soft warning** | Set a credit ceiling per Agency supplier; warn (don't hard-block — agencies routinely trade over-limit in practice) when a new invoice would exceed it |
| **Passport/NID + document management, expiry alerts** | Store passport/NID numbers and expiry dates on the Client record, allow scanned-document uploads, and surface a "passports/visas expiring in the next 30/60 days" widget on the dashboard |
| **Office expense tracking** | Rent, utilities, salaries, etc. as their own simple module, so "All-Time Profit" (ticket/visa margin) can optionally be shown alongside real net profit after overhead |
| **CSV export** | One-click export of the ledger or any report to CSV for Excel/backup, in addition to PDF |
| **Global search** | One search box across clients, suppliers, and transaction refs |
| **Multi-branch scaffold** | Add a `Branch` field to Users/Transactions now, even if you only ever use one branch — makes future expansion a config change, not a rewrite |
| **Inquiry → Quotation → Booking pipeline** | A lightweight pre-sales layer: log an inquiry (source, requirement, follow-up date), turn it into a quotation with one or more fare/package options, and convert an accepted quotation directly into a real ticket/visa invoice. Useful if a meaningful share of walk-in/phone inquiries don't convert immediately and currently fall through the cracks between "someone asked" and "an invoice got made" |
| **Hajj/Umrah group/package management** | If this agency runs group Hajj/Umrah packages: a `Package` record (name, per-pilgrim price, capacity, departure date) that many Client records attach to as a group, with per-pilgrim payment-collection status and a printable group manifest. This is structurally different from a single-client invoice, so it deserves its own module rather than being bolted onto the ticket form |
| **Manpower / overseas-employment visa case tracking** | If this agency also handles overseas job-placement visas ("manpower"): a case-status model per worker (employer/sponsor, destination country, job category, pipeline stage — application → medical → visa stamping → BMET clearance → flight booked → departed — document checklist, fees due). Distinct workflow from tourist ticket/visa sales |

Only build 2.2's last three modules if the agency's real business actually includes group religious-travel packages and/or overseas manpower placement — they're sized like small sub-applications, not quick add-ons. Everything else in 2.2 is small and safe to include broadly.

**Explicitly excluded, per your instructions:** any payment gateway/checkout integration (bKash, Nagad, SSLCommerz, Stripe, card processing). "Receipts" and "Payments" remain manual bookkeeping entries of money already received/paid elsewhere.

---

## 3. Architecture decisions

| Layer | Choice | Why |
|---|---|---|
| Backend runtime | Node.js + Express | Direct, well-documented, matches "MERN" as requested |
| Language | TypeScript (recommended) on both ends | Type safety around money math and API contracts; drop to JS if you'd rather move faster |
| Database | MongoDB Atlas (free M0 tier) | Free, zero server admin, and — importantly — Atlas clusters are replica sets out of the box, which is a **requirement** for the multi-document transactions this app needs for safe balance updates. (A bare local `mongod` is a standalone node and does *not* support transactions unless you initialize it as a one-node replica set — Atlas sidesteps that entirely) |
| ODM | Mongoose, with **discriminators** for the `Transaction` collection | One physical collection (so the unified Ledger view is a single query), but each transaction type (`TicketInvoice`, `VisaInvoice`, `ClientReceipt`, `SupplierTxn`, `RefundReissue`, `Expense`) keeps its own strongly-typed schema in code |
| Auth | JWT in an httpOnly cookie + bcrypt password hashes | No tokens sitting in `localStorage` (readable by any injected script); standard, well-understood pattern |
| Frontend build | Vite + React + React Router | Fast dev loop, no framework lock-in, easy for an agent to scaffold |
| Server state | TanStack Query | Directly replaces the prototype's `cloudDb` object + manual `renderAll()` call — mutations auto-invalidate the queries that depend on them (save an invoice → dashboard, ledger, and the relevant supplier balance all refetch automatically) |
| Styling | Tailwind CSS, themed from the prototype's existing palette | Keeps the distinct dark-navy/sky-blue identity the prototype already has (see design tokens in the spec) instead of drifting into a generic look; much faster for an AI agent to compose consistently than hand-written CSS |
| PDF generation | Puppeteer (headless Chromium) rendering an HTML template server-side | Reuses the prototype's existing report/receipt HTML almost verbatim, but produces a real downloadable/emailable PDF instead of relying on the browser's print dialog |
| File uploads | Multer → local disk under `backend/uploads/` (served statically), with a documented upgrade path to S3-compatible storage later | No third-party dependency needed to get started; swappable later without touching the rest of the app |
| Validation | Zod (or `express-validator`) on every request body | The prototype validates almost nothing server-side because there is no server; this is where that discipline moves to now |
| Testing | Jest + Supertest for the backend, focused first on the balance-update service functions | This is the single highest-risk piece of logic in the whole app — it deserves automated regression tests before anything else does |

---

## 4. The business logic you must not get wrong

This is the part of the prototype that's actually clever, just fragile in its current implementation. Preserve the *rules* exactly; fix the *mechanism*.

**Client due**
- `+= totalSell` when a ticket or visa invoice is created
- `-= amount` when a client receipt is created
- Reversed correctly on edit/void

**Supplier balance** — meaning depends on `type`:
- `PORTAL` (a prepaid wallet, e.g. a BSP/GDS wallet): deposits `+= amount`; every ticket/visa costed against this supplier `-= cost` (spending down the wallet)
- `AGENCY` (a running credit line with a consolidator): payments `-= amount`; every ticket/visa costed against this supplier `+= cost` (buying on credit increases what's owed)
- `DIRECT` (the in-house "own stock" pseudo-supplier, seeded once as `isSelf: true`): no balance effect, ever

**Editing a transaction:** fully reverse the *old* effect (on the old client/supplier, which may differ from the new one) before applying the *new* effect — the prototype already does this; the fix is doing it **inside a single MongoDB session transaction** instead of as two independent, unguarded writes.

**Voiding a transaction:** apply the same reversal math as editing, then mark the transaction `VOIDED` with a required reason (rather than deleting the row).

**All-time / filtered profit:** `sum(totalSell − totalBuy)` over `ACTIVE` ticket/visa transactions — compute with a MongoDB aggregation pipeline, not a browser-side loop over every record.

**Reference numbers:** replace `Date.now().toString().slice(-6)` with an atomic counter document per prefix-per-year (`findOneAndUpdate` with `$inc`, upserted), producing gapless, human-sortable refs like `INVT-2026-000123`.

**Safety net:** a `POST /api/maintenance/recalculate-balances` (admin-only) endpoint that replays every `ACTIVE` transaction from scratch and rewrites every cached `Client.currentDue` / `Supplier.balance`. Run it after any bulk data import, or any time a number looks suspicious — this is what "the balance can never permanently drift" actually rests on.

Full pseudocode and the exact Mongoose transaction pattern are in `02_TECHNICAL_SPEC.md §3`.

---

## 5. Phased build plan

Work through these **in order** — each phase depends on the data models and API surface the previous one built. Hand Antigravity one phase at a time (see §6 for how); don't try to get it to build the whole thing in a single task.

### Phase 0 — Scaffolding
- [ ] Create the repo root with two top-level folders: `frontend/` and `backend/`, each with its own `package.json`, plus a root `README.md` and `.gitignore`
- [ ] `backend/`: Express app skeleton, `dotenv`, MongoDB connection (Atlas), a `/api/health` route, `helmet`, `cors` (locked to the frontend's origin), `morgan` logging
- [ ] `frontend/`: Vite + React skeleton, React Router, Tailwind configured with the design tokens ported from the prototype's `style.css` (see spec §5)
- [ ] `.env.example` in both folders documenting every required variable
- [ ] ESLint + Prettier in both folders

**Done when:** `npm run dev` in `backend/` serves `/api/health`; `npm run dev` in `frontend/` renders a themed empty shell.

### Phase 1 — Auth & app shell
- [ ] `User` model (name, email, passwordHash, role, active) — see spec §2
- [ ] `POST /api/auth/setup` — one-time initial-admin creation, disabled once any admin exists
- [ ] `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — JWT in an httpOnly cookie
- [ ] Auth middleware: `requireAuth`, `requireRole(...)`
- [ ] Frontend: Login page, `AuthContext`, `ProtectedRoute` wrapper, app shell (header with logo pulled from `Settings`, nav routes replacing the prototype's tab buttons)

**Done when:** a fresh database forces you through the setup screen, then a normal login gates every other route.

### Phase 2 — Master data
- [ ] `Client`, `Supplier`, `Airline`, `Sector` models + full CRUD endpoints (spec §2/§4)
- [ ] Seed script: creates the one `isSelf: true` `DIRECT` supplier automatically (replacing the prototype's hardcoded `'SELF'` id)
- [ ] Server-side rule: block deleting a Client/Supplier that has any transactions referencing it (currently a client-side `alert()`; make it a real 409 response)
- [ ] Frontend: "Portals & Agencies" page (two-column layout, port of the prototype's UI), inline quick-add for Client/Airline/Sector exactly as in the prototype

**Done when:** you can create/edit/delete clients, suppliers, airlines, and sectors, and the delete-guard actually returns an error instead of trusting the browser.

### Phase 3 — Transactions & Ledger
- [ ] `Transaction` base schema + discriminators: `TicketInvoice`, `VisaInvoice`, `ClientReceipt`, `SupplierTxn` (spec §2)
- [ ] `Counter` model + ref-number generator util
- [ ] Service-layer functions (`createTicketInvoice`, `createVisaInvoice`, `createClientReceipt`, `createSupplierTxn`, `editTransaction`, `voidTransaction`) — **each wrapped in a Mongoose session transaction**, implementing §4's rules exactly
- [ ] `GET /api/transactions` — server-side pagination, search, type filter, date-range filter, sort (replacing the prototype's load-everything-into-memory approach)
- [ ] Frontend: Invoice form, Visa form, Receipt form (dynamic passenger rows, live totals — port of the prototype's UX), Ledger page (search/sort/filter/paginate, click-to-edit, void action)

**Done when:** creating, editing, and voiding a ticket invoice correctly moves the linked supplier's balance and the client's due every time, including when you change which client/supplier a transaction belongs to.

### Phase 4 — Dashboard & Reports
- [ ] `GET /api/dashboard/summary` and `GET /api/dashboard/profit-filter` — MongoDB aggregations (spec §4)
- [ ] Puppeteer-based PDF service; one shared HTML report template parameterized for all four report types + the receipt voucher
- [ ] `GET /api/reports/client-statement`, `/supplier-statement`, `/profit-ticket`, `/profit-visa` (JSON for on-screen preview, PDF for download)
- [ ] `GET /api/transactions/:id/receipt-pdf` — money receipt voucher, **preserving the Lakh/Crore `numberToWords` formatting exactly**
- [ ] Frontend: Dashboard page (stat cards, profit-by-date-range, quick actions), Reports page (same 4-report-type UI, downloads the real PDF)

**Done when:** every report and the receipt voucher render as an actual downloadable PDF with the same numbers you'd get from the old browser-print version.

### Phase 5 — Foundational hardening
- [ ] `AuditLog` model + a logging call inside every mutating service function from Phase 3
- [ ] Void UI polish: required reason, "Voided" badge, ledger toggle to show/hide voided rows
- [ ] Admin-only `POST /api/maintenance/recalculate-balances`
- [ ] Admin-only Users page + Audit Log page

**Done when:** every create/edit/void action for every entity leaves a readable trail of who did it and when, and you can prove the app's balances are self-consistent on demand.

### Phase 6 — Optional capability modules
Pick from §2.2 based on what the agency actually needs. Suggested build order if doing several: Refund/Reissue → Client aging report → Passport/document management + expiry alerts → Agency credit limits → CSV export → Global search → Expense tracking → (only if relevant) Inquiry/Quotation pipeline → Hajj/Umrah group management → Manpower case tracking.

### Phase 7 — Polish & deployment
- [ ] Responsive pass across the breakpoints already defined in the prototype's `style.css` (1200px / 840px / 640px)
- [ ] Jest + Supertest coverage for every Phase 3 service function (create → edit → void round-trips, verifying balances end back where they started)
- [ ] Deploy: MongoDB Atlas (already in use) · backend to Render/Railway · frontend to Vercel/Netlify · set `CORS`/env vars accordingly
- [ ] Confirm Atlas's automated backup is enabled (or add a scheduled `mongodump`) — this is now the business's real financial ledger

---

## 6. Working with Antigravity effectively

- **Feed it this pair of documents as project context**, not just a one-line prompt. Antigravity supports project-level custom instructions/skills defined as markdown files — drop both docs into the repo (e.g. `docs/01_ROADMAP.md`, `docs/02_TECHNICAL_SPEC.md`) so any agent working in this workspace can read them directly instead of relying on what you happen to type into a single prompt.
- **One phase per task, in order.** Phases 1–5 each depend on the models/endpoints the previous phase created — running them out of order (or all at once) is the fastest way to get inconsistent code. Use Antigravity's Manager surface to dispatch each phase as its own task and review the artifacts (diffs, screenshots, walkthrough) it comes back with before starting the next one.
- **Keep full-stack features together, not split by layer.** When you ask for "the ticket invoice feature," ask for the model + endpoint + service function + frontend form + ledger row rendering as *one* task. Splitting frontend and backend into separate agent runs for the same feature is what produces mismatched request/response shapes.
- **Use the Editor surface directly for the trickiest piece** — the balance reversal/reapply logic in §4 — rather than a fully autonomous Manager task. It's worth pairing closely on this one, since a subtle bug here is a real accounting error, not a cosmetic one.
- **Ask explicitly for tests on the money logic.** Prompt Antigravity to write the Phase 7 Jest tests *as it builds* each Phase 3 service function, not as an afterthought — "create an invoice, edit it to a different supplier, void it, assert every balance is back to its starting value" is the core test case.
- **Give it the "done when" line from each phase above as acceptance criteria** verbatim — it's written that way on purpose, so you can paste it straight into a task description.

---

## 7. What to hand Antigravity first

A good opening task description, ready to paste in:

> Read `docs/01_ROADMAP.md` and `docs/02_TECHNICAL_SPEC.md` in full before writing any code. Then complete **Phase 0** exactly as described: create the `frontend/` and `backend/` top-level folders per the spec's project structure, with working dev servers on both sides and the Tailwind theme from spec §5 applied to an empty shell. Do not start on Phase 1 yet — stop and show me the result first.
