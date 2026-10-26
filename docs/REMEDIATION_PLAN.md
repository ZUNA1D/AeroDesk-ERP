# AeroDesk ERP - End-to-End Remediation & Vulnerability Fix Plan

**Branch:** `qa/break-test-audit`  
**Date:** October 26, 2026  
**Status:** In Progress

This document defines the step-by-step, end-to-end plan to remediate all 14 vulnerabilities and defects discovered during the chaos testing audit. Each step specifies the root cause, target files, exact code adjustments, and verification criteria.

---

## Remediation Roadmap

### Phase 1: Security & Access Control (P0)
- [ ] **Step 1: Fix VULN-01** – Enforce authentication and strict tenant isolation on Printable Receipt Vouchers (`GET /api/transactions/:id/receipt-pdf`).
- [ ] **Step 2: Fix VULN-02** – Implement HTML entity escaping across `pdf.service.js` to eliminate Stored XSS in receipts and account statements.
- [ ] **Step 3: Fix VULN-04** – Enforce file extension and MIME type whitelisting in `upload.js` and set secure headers for uploaded files.
- [ ] **Step 4: Fix VULN-12** – Deprecate token acceptance via URL query strings in `auth.js` to prevent token leakage.
- [ ] **Step 5: Fix VULN-13** – Implement rate limiting on `POST /api/auth/login` to prevent brute force and credential stuffing.

### Phase 2: Financial Integrity & Ledger Safety (P0 / P1)
- [ ] **Step 6: Fix VULN-03** – Enforce non-negative price validation (`cost >= 0`, `sell >= 0`) in `createTicketInvoice` and `createVisaInvoice`.
- [ ] **Step 7: Fix VULN-08** – Enforce positive amount validation across all transaction updates in `editTransaction`.
- [ ] **Step 8: Fix VULN-09** – Restrict transaction voiding (`POST /transactions/:id/void`) to `MANAGER` and `ADMIN` roles.

### Phase 3: Multi-Tenancy & Query Robustness (P1)
- [ ] **Step 9: Fix VULN-05** – Add regex metacharacter escaping (`escapeRegex`) across all search controllers to prevent ReDoS / 500 crashes.
- [ ] **Step 10: Fix VULN-06** – Prevent `resolveClient` from falling through and creating ghost clients when a foreign agency ObjectId is supplied.
- [ ] **Step 11: Fix VULN-10** – Safely handle array query parameters in `supplier.controller.js` and other filters.
- [ ] **Step 12: Fix VULN-11** – Enhance `errorHandler.js` to map Mongoose `CastError` and `ValidationError` to clean 400/404 HTTP responses instead of 500.

### Phase 4: Business Logic & UI Validation (P2)
- [ ] **Step 13: Fix VULN-07** – Prevent administrators from deactivating their own account via `PATCH /api/users/:id`.
- [ ] **Step 14: Fix VULN-14** – Add robust client-side passenger row validation to `InvoicePage.jsx` and `VisaPage.jsx`.

### Phase 5: Verification & Regression Testing
- [ ] **Step 15** – Run `chaos_break_suite.mjs` and execute end-to-end verification to confirm that 0 vulnerabilities remain.

---

## Detailed Step-by-Step Implementation Guide

### Step 1: VULN-01 - Fix Unauthenticated IDOR on Receipt Vouchers
- **Target Files:**
  - [`backend/src/routes/transaction.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js)
  - [`backend/src/controllers/transaction.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js)
- **Change:**
  1. In `transaction.routes.js`, move `router.get('/:id/receipt-pdf', ...)` *below* `router.use(requireAuth)`.
  2. In `handleGetReceiptPdf`, ensure `query.agency = req.agencyId` is strictly enforced so users cannot view receipts belonging to other agencies.
- **Verification:**
  - Calling without token returns `401 Unauthorized`.
  - Calling with Tenant B's token against Tenant A's receipt returns `404 Not Found`.

### Step 2: VULN-02 - Fix Stored XSS in Printable Voucher HTML & Statements
- **Target File:**
  - [`backend/src/services/pdf.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/pdf.service.js)
- **Change:**
  1. Add an `escapeHtml(str)` utility:
     ```javascript
     function escapeHtml(str) {
       if (str == null) return '';
       return String(str)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#39;');
     }
     ```
  2. Wrap all user-provided strings in `escapeHtml()`: `receipt.remarks`, `receipt.ref`, `client.name`, `partyName`, `partyDetails`, `settings.companyName`, `r.description`, etc.
- **Verification:**
  - Create receipt with remarks `<script>alert(1)</script>`.
  - Fetch receipt HTML; confirm it contains `&lt;script&gt;alert(1)&lt;/script&gt;` and no executable script tag.

### Step 3: VULN-04 - Fix Unrestricted File Upload & Stored XSS
- **Target Files:**
  - [`backend/src/middleware/upload.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/upload.js)
  - [`backend/src/app.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/app.js)
- **Change:**
  1. In `upload.js`, add `fileFilter` allowing only:
     - MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
     - File extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  2. In `app.js`, configure `express.static(path.resolve(env.UPLOAD_DIR), { setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); } })`.
- **Verification:**
  - Uploading `.html` or `.exe` returns `400 Bad Request`.
  - Uploading `.pdf` or `.png` succeeds.

### Step 4: VULN-12 - Remove JWT Token from Query Parameters
- **Target File:**
  - [`backend/src/middleware/auth.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/auth.js)
- **Change:**
  Remove `if (!token && req.query?.token) token = req.query.token;` from `requireAuth` and `optionalAuth`.
- **Verification:**
  `curl http://localhost:5000/api/users?token=<valid_token>` returns `401 Unauthorized`.

### Step 5: VULN-13 - Add Rate Limiting to Auth Login
- **Target Files:**
  - [`backend/src/middleware/rateLimiter.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/rateLimiter.js) (new)
  - [`backend/src/routes/auth.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/auth.routes.js)
- **Change:**
  Implement a sliding window in-memory rate limiter middleware for `POST /api/auth/login` (e.g. max 10 failed/total attempts per 15 minutes per IP).
- **Verification:**
  Exceeding the threshold returns `429 Too Many Requests`.

### Step 6: VULN-03 - Enforce Non-Negative Amounts on Invoices
- **Target File:**
  - [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `createTicketInvoice` and `createVisaInvoice`, validate each passenger row:
  ```javascript
  if (cost < 0 || sell < 0) {
    throw new Error('Ticket cost and sell prices cannot be negative.');
  }
  ```
- **Verification:**
  Submitting `cost: -50000` returns `400 Bad Request`.

### Step 7: VULN-08 - Enforce Positive Amount Validation in `editTransaction`
- **Target File:**
  - [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `editTransaction` under `oldTx.type === 'EXPENSE'`, validate:
  ```javascript
  const numAmount = Number(newData.amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }
  ```
- **Verification:**
  Editing an expense to `-9999` returns `400 Bad Request`.

### Step 8: VULN-09 - Restrict Void Permission to Manager and Admin
- **Target File:**
  - [`backend/src/routes/transaction.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js)
- **Change:**
  Change line 36:
  `router.post('/:id/void', requireRole('MANAGER', 'ADMIN'), handleVoidTransaction);`
- **Verification:**
  STAFF role user calling `POST /api/transactions/:id/void` receives `403 Forbidden`.

### Step 9: VULN-05 - Escape Regex Metacharacters on Search Endpoints
- **Target Files:**
  - [`backend/src/controllers/client.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js)
  - [`backend/src/controllers/transaction.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js)
- **Change:**
  Create helper `escapeRegex(str)`:
  ```javascript
  export function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  ```
  Apply `escapeRegex(search.trim())` before creating `new RegExp(...)`.
- **Verification:**
  `GET /api/clients?search=[` and `GET /api/transactions?search=(` return `200 OK` with matching (or empty) results instead of crashing with 500.

### Step 10: VULN-06 - Prevent Cross-Agency ObjectId Ghost Client Minting
- **Target File:**
  - [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `resolveClient`:
  ```javascript
  if (mongoose.Types.ObjectId.isValid(clientIdOrName)) {
    const query = { _id: clientIdOrName };
    if (agencyId) query.agency = agencyId;
    const existing = await Client.findOne(query).session(session);
    if (existing) return existing;
    throw new Error('Specified client does not exist in this agency.');
  }
  ```
- **Verification:**
  Passing Tenant A's client ID into Tenant B's invoice creation throws an error and does NOT create a ghost client named with the hexadecimal ID.

### Step 11: VULN-10 - Handle Array Types in Query Parameters
- **Target File:**
  - [`backend/src/controllers/supplier.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/supplier.controller.js)
- **Change:**
  ```javascript
  if (type) {
    if (typeof type === 'string') {
      query.type = type.toUpperCase();
    } else if (Array.isArray(type)) {
      query.type = { $in: type.map(t => String(t).toUpperCase()) };
    }
  }
  ```
- **Verification:**
  `GET /api/suppliers?type[]=PORTAL` returns `200 OK` with portal suppliers.

### Step 12: VULN-11 - Map CastError and ValidationError to 400/404 in Central Error Handler
- **Target File:**
  - [`backend/src/middleware/errorHandler.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/errorHandler.js)
- **Change:**
  In `errorHandler`:
  - If `err.name === 'CastError'`, respond with status `400` (or `404` for `:id` route parameter lookups).
  - If `err.name === 'ValidationError'`, respond with status `400`.
  - If `err.message` matches known business errors (e.g. `'already voided'`, `'greater than zero'`), respond with status `400`.
- **Verification:**
  `GET /api/clients/invalid-id` returns `400 Bad Request` or `404 Not Found` with clean JSON, not 500.

### Step 13: VULN-07 - Prevent Admin Self-Deactivation in `updateUser`
- **Target File:**
  - [`backend/src/controllers/user.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js)
- **Change:**
  In `updateUser`:
  ```javascript
  if (active === false && String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account.' });
  }
  ```
- **Verification:**
  Admin calling `PATCH /api/users/<myId>` with `{ active: false }` receives `400 Bad Request`.

### Step 14: VULN-14 - Add Client-Side Passenger Row Validation
- **Target Files:**
  - [`frontend/src/pages/InvoicePage.jsx`](file:///c:/Users/send2/Desktop/SAL%202.0/frontend/src/pages/InvoicePage.jsx)
  - [`frontend/src/pages/VisaPage.jsx`](file:///c:/Users/send2/Desktop/SAL%202.0/frontend/src/pages/VisaPage.jsx)
- **Change:**
  Before submitting:
  1. Verify every passenger has a non-empty name (`p.name.trim()`).
  2. Verify costs and sells are valid numbers `>= 0`.
  3. Display an inline alert if any passenger row is invalid.
- **Verification:**
  Submitting an empty passenger row displays an inline validation message and blocks request dispatch.

---

---

## Phase 6: Second-Round Edge Cases & Accounting Security

### Step 15: VULN-15 & VULN-16 - Safe Refund Validation & Over-Refund Prevention
- **Target File:** [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `createRefund`:
  1. Reject refund if `parent.status !== 'ACTIVE'`.
  2. Reject refund if `parent.type !== 'TICKET_INVOICE' && parent.type !== 'VISA_INVOICE'`.
  3. Validate amounts `clientRefundAmount >= 0`, `supplierRefundAmount >= 0`, and at least one `> 0`.
  4. Query existing active refunds for `parentTransaction` and enforce cumulative refunds `<= parent.totalSell` (client) and `<= parent.totalBuy` (supplier).

### Step 16: VULN-17 - Prevent Voiding Invoices with Active Refunds
- **Target File:** [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `voidTransaction`:
  Query active refunds linked to the invoice. If any active refunds exist, reject the void operation with 400 Bad Request to prevent double refunding / balance corruption.

### Step 17: VULN-18 - Fix Profit Report Airline and Sector Filters
- **Target File:** [`backend/src/services/report.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/report.service.js)
- **Change:**
  1. Add `query['passengers.airline'] = airlineId` in `getTicketProfitReport`.
  2. Add `query['passengers.sector'] = sectorId` in `getVisaProfitReport`.
  3. Filter passenger arrays when summing costs, sells, and profit to ensure strictly scoped reporting.

### Step 18: VULN-19 - Fast Reject Long Passwords to Prevent Bcrypt CPU Exhaustion
- **Target Files:**
  - [`backend/src/controllers/auth.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/auth.controller.js)
  - [`backend/src/controllers/user.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js)
- **Change:**
  Add `if (password.length > 128) return res.status(400)` upfront on login, registration, and user update/creation.

### Step 19: VULN-20 - Fix `ReferenceError: before is not defined` on User Update
- **Target File:** [`backend/src/controllers/user.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js)
- **Change:**
  Declare `const before = user.toObject();` in `updateUser` before making modifications.

### Step 20: VULN-21 - Verify Expense Category Tenant Isolation
- **Target File:** [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  Validate `categoryId` against `ExpenseCategory` with tenant filter (`agency: req.agencyId`).

### Step 21: VULN-22 - Block Transactions on In-House Stock Suppliers
- **Target File:** [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js)
- **Change:**
  In `createSupplierTxn`, throw error if `supplier.isSelf || supplier.type === 'DIRECT'`.

### Step 22: VULN-23 - Restrict Transaction Modification Permissions
- **Target File:** [`backend/src/routes/transaction.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js)
- **Change:**
  Change `PATCH /api/transactions/:id` permission guard from `requireRole('STAFF', 'MANAGER', 'ADMIN')` to `requireRole('MANAGER', 'ADMIN')`.

### Step 23: VULN-24 & VULN-25 - Pagination Limits and Multi-Type Queries
- **Target Files:**
  - [`backend/src/controllers/transaction.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js)
  - [`backend/src/controllers/client.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js)
  - [`backend/src/controllers/audit.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/audit.controller.js)
  - [`backend/src/routes/auth.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/auth.routes.js)
- **Change:**
  1. Enforce `limitNum = Math.min(100, Math.max(1, limit))`.
  2. Support array query parameters for `type`.
  3. Apply `registerLimiter` rate limiting to `POST /api/auth/register`.

---

## Execution Tracker
- [x] Phase 1: Security & Access Control (VULN-01, VULN-02, VULN-04, VULN-12, VULN-13) - **PASSED**
- [x] Phase 2: Financial Integrity & Ledger Safety (VULN-03, VULN-08, VULN-09) - **PASSED**
- [x] Phase 3: Multi-Tenancy & Query Robustness (VULN-05, VULN-06, VULN-10, VULN-11) - **PASSED**
- [x] Phase 4: Business Logic & UI Validation (VULN-07, VULN-14) - **PASSED**
- [x] Phase 5: Verification & Regression Testing (`remediation_verification.mjs` 14/14 passed) - **PASSED**
- [x] Phase 6: Second-Round Testing & Edge Cases (VULN-15 through VULN-25, 11/11 passed) - **PASSED**
