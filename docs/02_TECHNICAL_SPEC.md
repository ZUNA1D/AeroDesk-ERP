# Technical Specification — Travel & Aviation Agency ERP (MERN)

> Companion to `01_ROADMAP.md`. This file is the exact reference to build against: project structure, data models, API contracts, the balance-update algorithm, and the frontend architecture. Field names below are the contract — keep frontend, backend, and tests consistent with them.

## 1. Project structure

```
travel-agency-erp/
├── README.md
├── .gitignore
├── docs/
│   ├── 01_ROADMAP.md
│   └── 02_TECHNICAL_SPEC.md
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── uploads/                 # gitignored — multer file storage
│   └── src/
│       ├── server.js            # entrypoint: connect DB, start HTTP server
│       ├── app.js                # express app, middleware, route mounting
│       ├── config/
│       │   ├── env.js
│       │   └── db.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Client.js
│       │   ├── Supplier.js
│       │   ├── Airline.js
│       │   ├── Sector.js
│       │   ├── Counter.js
│       │   ├── Settings.js
│       │   ├── AuditLog.js
│       │   ├── ExpenseCategory.js   (Phase 6)
│       │   └── transaction/
│       │       ├── Transaction.js         # base schema + discriminator key
│       │       ├── TicketInvoice.js
│       │       ├── VisaInvoice.js
│       │       ├── ClientReceipt.js
│       │       ├── SupplierTxn.js
│       │       ├── RefundReissue.js       (Phase 6)
│       │       └── Expense.js             (Phase 6)
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       │   ├── transaction.service.js   # the atomic balance-update logic (§3)
│       │   ├── report.service.js
│       │   ├── pdf.service.js           # Puppeteer wrapper
│       │   └── counter.service.js       # ref-number generator
│       ├── middleware/
│       │   ├── auth.js                  # requireAuth, requireRole
│       │   ├── validate.js              # Zod/express-validator wrapper
│       │   └── errorHandler.js
│       └── utils/
│           ├── money.js                 # formatMoney (en-BD style)
│           └── numberToWords.js         # Lakh/Crore spelling, ported as-is
│
└── frontend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── router.jsx
        ├── api/
        │   ├── client.js             # fetch/axios wrapper, base URL from env
        │   ├── auth.api.js
        │   ├── clients.api.js
        │   ├── suppliers.api.js
        │   ├── transactions.api.js
        │   ├── reports.api.js
        │   └── dashboard.api.js
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useDebounce.js
        │   └── (TanStack Query hooks per resource)
        ├── components/
        │   ├── layout/ (Header, NavTabs, ProtectedRoute)
        │   ├── ui/ (Button, Card, StatCard, Pill, Badge, InputField, Modal, Table)
        │   └── forms/ (PassengerRowsTable, VisaRowsTable, QuickAddInline)
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── InvoicePage.jsx
        │   ├── VisaPage.jsx
        │   ├── ReceiptsPage.jsx
        │   ├── LedgerPage.jsx
        │   ├── SuppliersPage.jsx
        │   ├── ReportsPage.jsx
        │   ├── SettingsPage.jsx
        │   ├── UsersPage.jsx          # admin
        │   └── AuditLogPage.jsx       # admin
        └── utils/
            ├── formatMoney.js
            └── numberToWords.js
```

Two independent Node projects, exactly as requested — nothing shared at the tooling level. The tiny `money.js` / `numberToWords.js` utilities are intentionally duplicated (backend needs them for PDFs, frontend needs them for live totals) rather than pulled into a monorepo workspace — they're ~30 lines each and not worth the extra tooling complexity.

---

## 2. Data models

All models live under `backend/src/models/`. Mongoose syntax; drop the TS types if building in plain JS.

### User
```js
{
  name: String, required,
  email: { type: String, required, unique, lowercase: true },
  passwordHash: String, required,
  role: { type: String, enum: ['ADMIN','MANAGER','STAFF'], default: 'STAFF' },
  branch: { type: ObjectId, ref: 'Branch' },   // Phase 6 multi-branch, optional
  active: { type: Boolean, default: true },
  timestamps: true
}
```

### Client
```js
{
  name: { type: String, required, uppercase: true },
  phone: String,
  email: String,
  address: String,
  passportNo: String,
  nid: String,
  passportExpiry: Date,
  notes: String,
  currentDue: { type: Number, default: 0 },   // cached — see §3
  documents: [{ filename: String, url: String, uploadedAt: Date }],
  createdBy: { type: ObjectId, ref: 'User' },
  timestamps: true
}
```

### Supplier
```js
{
  name: { type: String, required },
  type: { type: String, enum: ['PORTAL','AGENCY','DIRECT'], required },
  isSelf: { type: Boolean, default: false },   // true for exactly one DIRECT supplier, seeded once
  contactPerson: String,
  phone: String,
  email: String,
  creditLimit: Number,                          // AGENCY only, optional
  balance: { type: Number, default: 0 },        // cached — see §3; meaning depends on `type`
  active: { type: Boolean, default: true },
  timestamps: true
}
```

### Airline
```js
{ name: { type: String, required, unique, uppercase: true }, iataCode: String, timestamps: true }
```

### Sector
```js
{ name: { type: String, required, unique, uppercase: true }, origin: String, destination: String, timestamps: true }
```

### Counter (ref-number generator)
```js
{ _id: String,     // e.g. "INVT-2026"
  seq: { type: Number, default: 0 } }
```

### Settings (one singleton document)
```js
{
  companyName: { type: String, default: 'Syed Aviation' },   // editable — this is the whole point of §0
  logoUrl: String,
  address: String,
  phone: String,
  email: String,
  currency: { type: String, default: 'BDT' },
  timestamps: true
}
```

### AuditLog
```js
{
  entityType: String,     // 'Transaction' | 'Client' | 'Supplier' | ...
  entityId: { type: ObjectId, required },
  action: { type: String, enum: ['CREATE','UPDATE','VOID','DELETE'] },
  performedBy: { type: ObjectId, ref: 'User' },
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
}
```

### Transaction (base + discriminators)

Base schema — every transaction type shares these fields:
```js
{
  ref: { type: String, required, unique },
  type: { type: String, required, enum: [
    'TICKET_INVOICE','VISA_INVOICE','CLIENT_RECEIPT',
    'SUPPLIER_DEPOSIT','SUPPLIER_PAYMENT',
    'SUPPLIER_DEBIT_MEMO','SUPPLIER_CREDIT_MEMO',   // Phase 6 — ADM/ACM
    'REFUND','REISSUE',                              // Phase 6
    'EXPENSE'                                        // Phase 6
  ]},
  date: { type: Date, required },
  status: { type: String, enum: ['ACTIVE','VOIDED'], default: 'ACTIVE' },
  voidReason: String,
  voidedBy: { type: ObjectId, ref: 'User' },
  voidedAt: Date,
  client: { type: ObjectId, ref: 'Client' },
  supplier: { type: ObjectId, ref: 'Supplier' },
  createdBy: { type: ObjectId, ref: 'User' },
  branch: { type: ObjectId, ref: 'Branch' },        // Phase 6
  attachments: [{ filename: String, url: String, uploadedAt: Date }],
  timestamps: true
}
// discriminatorKey: 'type', collection: 'transactions'
```

Discriminator: `TicketInvoice` (adds to base)
```js
{
  passengers: [{
    name: String, ticketNo: String, pnr: String,
    airline: { type: ObjectId, ref: 'Airline' },
    route: String,
    cost: Number, sell: Number
  }],
  totalBuy: Number, totalSell: Number, profit: Number
}
```

Discriminator: `VisaInvoice` (adds to base)
```js
{
  passengers: [{
    name: String, visaNo: String,
    sector: { type: ObjectId, ref: 'Sector' },
    cost: Number, sell: Number
  }],
  totalBuy: Number, totalSell: Number, profit: Number
}
```

Discriminator: `ClientReceipt` (adds to base)
```js
{ amount: Number, mode: { type: String, enum: ['CASH','BANK','MOBILE','CARD'] }, remarks: String }
```

Discriminator: `SupplierTxn` (adds to base — covers deposit/payment/ADM/ACM, distinguished by `type`)
```js
{ amount: Number, remarks: String, bspRef: String }   // bspRef optional, used by ADM/ACM
```

Discriminator: `RefundReissue` (Phase 6)
```js
{ parentTransaction: { type: ObjectId, ref: 'Transaction' }, amount: Number, reason: String }
```

Discriminator: `Expense` (Phase 6)
```js
{ category: { type: ObjectId, ref: 'ExpenseCategory' }, amount: Number, remarks: String }
```

**Why discriminators, not one flexible schema:** the Ledger view needs a single collection to query across all types (search/sort/filter/paginate once), but each type has genuinely different required fields. Mongoose discriminators give both — one physical collection, strongly-typed sub-schemas in code.

---

## 3. The balance-update algorithm (read this before writing `transaction.service.js`)

This is the part flagged in the roadmap as the highest-risk logic in the app. Every function below runs inside a single Mongoose session transaction (`session.withTransaction(async () => { ... })`), so the `Transaction` write and every `Client`/`Supplier` balance write either all succeed together or all roll back together — this is what actually fixes the drift risk described in the roadmap.

### `createTicketInvoice(data, session)` / `createVisaInvoice(...)` (same shape)
```
1. Validate: at least one passenger row with non-empty data; totalBuy/totalSell not both zero
2. ensureClientExists(clientName) — find or create, within the same session
3. ref = counterService.next('INVT' | 'VISA', year)
4. Insert the Transaction (discriminator) document
5. client.currentDue += totalSell   → save
6. if supplier.type === 'PORTAL': supplier.balance -= totalBuy
   if supplier.type === 'AGENCY': supplier.balance += totalBuy
   if supplier.type === 'DIRECT': no-op
   → save
7. writeAuditLog('CREATE', 'Transaction', tx._id, before=null, after=tx)
```

### `createClientReceipt(data, session)`
```
1. Validate amount > 0
2. ensureClientExists(clientName)
3. ref = counterService.next('CRV', year)
4. Insert Transaction
5. client.currentDue -= amount → save
6. writeAuditLog(...)
```

### `createSupplierTxn(data, session)`
```
1. Validate amount > 0, supplier exists
2. type = supplier.type === 'PORTAL' ? 'SUPPLIER_DEPOSIT' : 'SUPPLIER_PAYMENT'
   (or SUPPLIER_DEBIT_MEMO / SUPPLIER_CREDIT_MEMO if explicitly chosen — Phase 6)
3. ref = counterService.next(prefixFor(type), year)
4. Insert Transaction
5. if type is a "credit-to-us" movement (deposit, credit memo): supplier.balance += amount
   if type is a "we-paid-them" movement (payment, debit memo):  supplier.balance -= amount
   → save
6. writeAuditLog(...)
```

### `editTransaction(id, newData, session)` — the reverse-then-reapply pattern
```
1. Load the existing transaction (call it `old`)
2. Fully REVERSE old's effect:
   - if old.client: client.currentDue -= old's original effect on due
   - if old.supplier: supplier.balance -= old's original effect on balance
     (mirror image of the create-time math above — subtract what create added, add back what create subtracted)
   → save reversed client/supplier
3. Apply NEW effect exactly as in the relevant create* function above,
   using the (possibly different) client/supplier from newData
4. Update the Transaction document's fields in place (same _id, same ref)
5. writeAuditLog('UPDATE', ..., before=old, after=updated)
```
If the old and new client/supplier are the same document, steps 2 and 3 net out correctly because they run inside the same session — read the current value, apply both deltas, then save once.

### `voidTransaction(id, reason, userId, session)`
```
1. Load the transaction; if already VOIDED, reject
2. Apply the same reversal math as step 2 of editTransaction above
3. Set status = 'VOIDED', voidReason = reason, voidedBy = userId, voidedAt = now
   (do NOT delete the document)
4. writeAuditLog('VOID', ..., before=active, after=voided)
```

### `hardDeleteTransaction(id, session)` — Admin-only, exceptional path
Same reversal as void, then `Transaction.deleteOne()`. Intended only for same-day data-entry mistakes; every other correction should be a void.

### `recalculateAllBalances()` — the safety net
```
1. Set every Client.currentDue = 0, every Supplier.balance = 0 (in a session)
2. Stream every ACTIVE transaction ordered by date/createdAt
3. Replay steps 5–6 of the relevant create* function above for each one
4. Save all final values
```
Expose as `POST /api/maintenance/recalculate-balances`, admin-only. Run it after any bulk import, or whenever a number looks wrong — this is the mechanism that makes "the balance can never permanently drift" actually true, rather than just hoped-for.

### All-time / filtered profit (dashboard) — aggregation, not a loop
```js
Transaction.aggregate([
  { $match: { type: { $in: ['TICKET_INVOICE','VISA_INVOICE'] }, status: 'ACTIVE',
              ...(from && to ? { date: { $gte: from, $lte: to } } : {}) } },
  { $group: { _id: null, total: { $sum: { $subtract: ['$totalSell','$totalBuy'] } } } }
])
```

### Reference number generator
```js
async function nextRef(prefix, session) {
  const key = `${prefix}-${new Date().getFullYear()}`;
  const doc = await Counter.findOneAndUpdate(
    { _id: key }, { $inc: { seq: 1 } },
    { new: true, upsert: true, session }
  );
  return `${key}-${String(doc.seq).padStart(6, '0')}`;   // e.g. "INVT-2026-000123"
}
```

---

## 4. API reference

All routes prefixed `/api`. Auth via httpOnly cookie unless noted. `role:` shows the minimum role required.

### Auth
| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/auth/setup` | none | one-time; 403 if any admin already exists |
| POST | `/auth/login` | none | sets httpOnly cookie |
| POST | `/auth/logout` | any | clears cookie |
| GET | `/auth/me` | any | current user |

### Users (admin)
| Method | Path | Role |
|---|---|---|
| GET | `/users` | ADMIN |
| POST | `/users` | ADMIN |
| PATCH | `/users/:id` | ADMIN |
| PATCH | `/users/:id/deactivate` | ADMIN |

### Master data
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/clients?search=&page=&limit=` | any | |
| POST | `/clients` | STAFF+ | |
| GET | `/clients/:id` | any | |
| PATCH | `/clients/:id` | STAFF+ | |
| DELETE | `/clients/:id` | MANAGER+ | 409 if the client has any transactions |
| POST | `/clients/:id/documents` | STAFF+ | multipart upload, Phase 6 |
| GET / POST | `/suppliers` | any / STAFF+ | filter `?type=PORTAL|AGENCY|DIRECT` |
| PATCH / DELETE | `/suppliers/:id` | STAFF+ / MANAGER+ | delete blocked if transactions exist |
| GET / POST / DELETE | `/airlines` | any / STAFF+ / MANAGER+ | |
| GET / POST / DELETE | `/sectors` | any / STAFF+ / MANAGER+ | |

### Transactions
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/transactions?search=&type=&status=&clientId=&supplierId=&from=&to=&sort=&page=&limit=` | any | server-side everything |
| POST | `/transactions/ticket-invoice` | STAFF+ | |
| POST | `/transactions/visa-invoice` | STAFF+ | |
| POST | `/transactions/client-receipt` | STAFF+ | |
| POST | `/transactions/supplier-txn` | STAFF+ | body includes explicit subtype for ADM/ACM (Phase 6) |
| PATCH | `/transactions/:id` | STAFF+ | same-type edit only |
| POST | `/transactions/:id/void` | STAFF+ | body: `{ reason }` |
| DELETE | `/transactions/:id` | ADMIN | hard delete, exceptional path |
| POST | `/transactions/:id/refund` | STAFF+ | Phase 6 |
| POST | `/transactions/:id/reissue` | STAFF+ | Phase 6 |
| GET | `/transactions/:id/receipt-pdf` | any | money receipt voucher PDF |

### Reports
| Method | Path | Notes |
|---|---|---|
| GET | `/reports/client-statement?clientId=&from=&to=&format=json\|pdf` | opening balance + period activity + closing due, mirrors the prototype's logic |
| GET | `/reports/supplier-statement?supplierId=&from=&to=&format=` | |
| GET | `/reports/profit-ticket?from=&to=&format=` | |
| GET | `/reports/profit-visa?from=&to=&format=` | |
| GET | `/reports/client-aging` | Phase 6 |
| GET | `/reports/expense-summary` | Phase 6 |

### Dashboard
| Method | Path |
|---|---|
| GET | `/dashboard/summary` |
| GET | `/dashboard/profit-filter?from=&to=` |
| GET | `/dashboard/expiring-documents` — Phase 6 |

### Settings, audit, maintenance
| Method | Path | Role |
|---|---|---|
| GET | `/settings` | any |
| PATCH | `/settings` | ADMIN — multipart for logo |
| GET | `/audit-logs?entityType=&userId=&from=&to=` | ADMIN |
| POST | `/maintenance/recalculate-balances` | ADMIN |

---

## 5. Frontend architecture & design tokens

**State management:** TanStack Query for all server data. Every mutation (`useMutation`) declares which query keys it invalidates — e.g. saving a ticket invoice invalidates `['dashboard-summary']`, `['transactions']`, and `['suppliers', supplierId]`. This is the direct, idiomatic replacement for the prototype's `cloudDb` object plus its single global `renderAll()` call after every save.

**Routing:** one route per prototype "tab" — `/dashboard`, `/invoice`, `/visa`, `/receipts`, `/ledger`, `/suppliers`, `/reports`, `/settings`, plus `/login`, `/users` and `/audit-log` (admin-only routes, hidden from nav for non-admins).

**Design tokens** — ported from the prototype's existing `style.css` so the rebuilt app keeps its current visual identity instead of drifting into a generic template look. Configure these as a Tailwind theme extension:

| Token | Value | Used for |
|---|---|---|
| `primary` / `bg` | `#0f172a` | header, dashboard cards, dark backgrounds |
| `accent` | `#38bdf8` | focus rings, active tab, gradient start |
| `success` | `#22c55e` | gradient end (primary button), asset/wallet chips |
| `danger` | `#f87171` / `#dc2626` | destructive actions, offline/void badges |
| — | `#ffffff` card surface, `rounded-2xl`, soft shadow | all `Card` components |
| — | fully-rounded (`rounded-full`) pills/badges/nav-tabs/buttons | `Pill`, `Badge`, `Button`, `NavTab` |
| — | `system-ui, -apple-system, "Segoe UI", sans-serif` | body font |
| — | radial gradient header/dashboard cards (`#1e293b` → `#020617`) | `.card-dashboard`, `header` |
| — | gradient primary button (sky → green) | `Button variant="primary"` |

Breakpoints to replicate: `1200px` (input grids collapse to 2 columns), `840px` (main grid collapses to 1 column, header stacks), `640px` (buttons go full-width, input grids collapse to 1 column) — these match the prototype's existing `@media` rules exactly.

**Key reusable components to build once, use everywhere:**
- `StatCard` (label, value, chip variant) — the 4 dashboard tiles
- `PassengerRowsTable` / `VisaRowsTable` — dynamic add/remove row table with live total calculation, used by the Invoice and Visa pages respectively
- `QuickAddInline` — the "type a name, click Add" pattern used for clients/airlines/sectors
- `SupplierCard` — the portal/agency card with balance + action buttons
- `LedgerTable` — search/sort/filter/paginate, expandable detail row, click-to-edit

**PDF/print handling on the frontend:** report and receipt "print" buttons call the corresponding `format=pdf` (or `/receipt-pdf`) endpoint, receive a `Blob`, and either `window.open(URL.createObjectURL(blob))` or trigger a download — no client-side HTML template building, unlike the prototype.

---

## 6. Environment variables

**`backend/.env.example`**
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/travel_agency_erp
JWT_SECRET=<random-long-string>
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
```

**`frontend/.env.example`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 7. Seed script (`backend/src/scripts/seed.js`)

Run once against a fresh database:
1. Create the singleton `Settings` document with `companyName: 'Syed Aviation'` (editable afterward from the Settings page — this is the seed default, not a hardcoded value anywhere else in the code)
2. Create the one `isSelf: true`, `type: 'DIRECT'` Supplier (`"IN-HOUSE / OWN STOCK"`)
3. Prompt for (or accept via CLI args) the first admin's name/email/password and create that `User`

This replaces the prototype's implicit `if (!suppliers.find(s => s.id === 'SELF'))` auto-creation and its complete absence of any first-user flow.
