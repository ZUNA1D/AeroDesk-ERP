# AeroDesk ERP - Comprehensive Chaos, Stress & Security Audit Report

**Branch:** `qa/break-test-audit`  
**Date:** October 26, 2026  
**Auditor:** Automated Chaos & Penetration Testing Agent (Pair Programmer)  
**System:** AeroDesk - Travel & Aviation ERP (Multi-Tenant SaaS)  
**Target Environment:** Local Node.js / Express API (`http://localhost:5000`) & Vite / React Frontend (`http://localhost:5173`)

---

## 1. Executive Summary

During this aggressive "Break the Website" assessment, we systematically attacked the AeroDesk ERP application across 5 core attack and stress vectors:
1. **Authentication, Authorization & Multi-Tenancy Isolation**
2. **Financial Integrity & Double-Spend / Balance Manipulation**
3. **Input Fuzzing, Regex Denial-of-Service (ReDoS) & Parameter Injection**
4. **File Upload Security & Stored Cross-Site Scripting (XSS)**
5. **Frontend UI/UX Error Boundaries & Edge-Case Failure States**

**Key Finding:** While the application incorporates strong baseline security (JWT authentication, role middlewares, and MongoDB replica set multi-document transactions), our chaos tests successfully exposed **14 critical, high, and medium defects** that can corrupt accounting ledgers, leak confidential client and billing data across tenants, execute arbitrary JavaScript via stored XSS, and trigger unhandled server 500 crashes from simple UI inputs.

---

## 2. Vulnerability & Defect Summary Matrix

| ID | Severity | Category | Title | Affected Component |
| :--- | :--- | :--- | :--- | :--- |
| **VULN-01** | **CRITICAL** | Security / Data Leak | Unauthenticated IDOR & Cross-Tenant Leakage on Printable Receipt Vouchers | [`backend/src/controllers/transaction.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js#L230-L257) |
| **VULN-02** | **CRITICAL** | Security / XSS | Stored Cross-Site Scripting (XSS) in Printable Voucher HTML & Statement Reports | [`backend/src/services/pdf.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/pdf.service.js#L185-L215) |
| **VULN-03** | **CRITICAL** | Financial Integrity | Negative Financial Amount Allowed on Invoices (Artificially Inflates Supplier Wallets & Erases Debt) | [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L206-L230) |
| **VULN-04** | **HIGH** | Security / Uploads | Unrestricted File Upload & Stored XSS via Client Documents (`.html`, `.svg`, `.exe`) | [`backend/src/middleware/upload.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/upload.js#L25-L28) |
| **VULN-05** | **HIGH** | Robustness / Crash | Unescaped Regex in Client & Transaction Search Causes 500 Crash on `[` or `(` | [`backend/src/controllers/client.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js#L10-L20) |
| **VULN-06** | **HIGH** | Multi-Tenancy / Hygiene | Cross-Agency Client ID Fallback Silently Provisions Hexadecimal Ghost Clients | [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L68-L84) |
| **VULN-07** | **HIGH** | Access Control | Workspace Administrator Can Deactivate Their Own Account (Permanent Self-Lockout) | [`backend/src/controllers/user.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js#L78-L100) |
| **VULN-08** | **HIGH** | Financial Integrity | Existing Expenses Can Be Edited to Negative Amounts via PATCH | [`backend/src/services/transaction.service.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L722-L728) |
| **VULN-09** | **MEDIUM** | Separation of Duties | Junior Staff Role Can Unilaterally Void Any Transaction Without Approval | [`backend/src/routes/transaction.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js#L35-L37) |
| **VULN-10** | **MEDIUM** | Robustness / Crash | Query Parameter Array TypeError Crashes Supplier Listing (`?type[]=PORTAL`) | [`backend/src/controllers/supplier.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/supplier.controller.js#L9-L11) |
| **VULN-11** | **MEDIUM** | Error Handling | Malformed Mongoose ObjectId Strings Trigger Unhandled 500 CastError | Multiple Controllers (`/clients/:id`, `/suppliers/:id`, etc.) |
| **VULN-12** | **MEDIUM** | Security / Session | JWT Authentication Accepted via URL Query String (`?token=...`) | [`backend/src/middleware/auth.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/auth.js#L17-L19) |
| **VULN-13** | **MEDIUM** | Security / Defense | Zero Rate Limiting on Login Endpoint (`POST /api/auth/login`) | [`backend/src/routes/auth.routes.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/auth.routes.js#L10) |
| **VULN-14** | **LOW** | UI / UX | Missing Frontend Validation on Passenger Rows Causes 500 Error Toast | [`frontend/src/pages/InvoicePage.jsx`](file:///c:/Users/send2/Desktop/SAL%202.0/frontend/src/pages/InvoicePage.jsx#L82-L100) |

---

## 3. In-Depth Vulnerability Details & Proof of Concepts (PoC)

### VULN-01: Unauthenticated IDOR & Cross-Tenant Leakage on Printable Vouchers
- **Severity:** `CRITICAL`
- **Location:** [`backend/src/routes/transaction.routes.js:21`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js#L21) & [`backend/src/controllers/transaction.controller.js:230-255`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js#L230-L255)
- **Description:**  
  The endpoint `GET /api/transactions/:id/receipt-pdf` is defined *before* `router.use(requireAuth)` and uses `optionalAuth`. When an unauthenticated request is made, `req.agencyId` is `undefined`. Consequently, the query executed against the database is purely `{ _id: id }` or `{ ref: id }` without any tenant scoping (`query.agency`).
- **Proof of Concept:**
  ```bash
  curl -s http://localhost:5000/api/transactions/CRV-2026-000001/receipt-pdf
  ```
  **Result:** HTTP 200 OK. Returns the complete printable HTML voucher revealing the full name of the passenger/client, payment amounts, contact numbers, and agency identity without providing any bearer token or session cookie.
- **Remediation:**  
  Protect voucher endpoints behind `requireAuth`. If public receipt links are needed for external customers, generate a cryptographically signed one-time token or HMAC URL parameter (e.g., `?signature=...&expires=...`) rather than exposing raw sequential IDs publicly.

---

### VULN-02: Stored Cross-Site Scripting (XSS) in Printable Voucher HTML & Statement Reports
- **Severity:** `CRITICAL`
- **Location:** [`backend/src/services/pdf.service.js:185-215`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/pdf.service.js#L185-L215)
- **Description:**  
  `renderMoneyReceiptHtml` and `renderStatementHtml` construct HTML documents using raw template literal strings. User inputs such as `receipt.remarks`, `client.name`, and `partyDetails` are interpolated directly:
  ```javascript
  <td class="meta-value" colspan="3">${receipt.remarks || 'Payment on account'}</td>
  ```
- **Proof of Concept:**  
  Create a money receipt with remarks: `<script>alert(document.cookie)</script>` or `<img src=x onerror=alert(1)>`. When opening `GET /api/transactions/:id/receipt-pdf`, the browser parses the unescaped HTML tag and executes the JavaScript.
- **Remediation:**  
  Sanitize/escape all dynamic HTML interpolations with an HTML entity encoding helper (e.g. `he.encode()` or replacing `&`, `<`, `>`, `"`, `'`).

---

### VULN-03: Negative Financial Amounts Allowed on Invoices (Balance Manipulation)
- **Severity:** `CRITICAL`
- **Location:** [`backend/src/services/transaction.service.js:206-230`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L206-L230)
- **Description:**  
  `createTicketInvoice` and `createVisaInvoice` parse passenger costs and sell figures via `Number(p.cost) || 0`, but never assert that `cost >= 0` and `sell >= 0`.
  When a negative invoice is issued (e.g., `cost = -50,000` and `sell = -80,000`):
  1. `clientDelta = totalSell * multiplier = -80,000`. The client's receivable debt is decreased by 80,000 BDT.
  2. For a `PORTAL` supplier: `supplierDelta = -cost * multiplier = -(-50,000) = +50,000`. The supplier's prepaid wallet balance is artificially increased by 50,000 BDT out of thin air.
- **Proof of Concept:**
  ```javascript
  POST /api/transactions/ticket-invoice
  {
    "clientId": "6ac7345b5a188076dd218c5e",
    "supplierId": "6ac7345b5a188076dd218c48",
    "passengers": [{ "name": "EXPLOIT", "cost": -50000, "sell": -80000 }]
  }
  ```
  **Result:** HTTP 201 Created. The client ledger reflects `-80,000 BDT`, and the portal wallet balance increases by `+50,000 BDT`.
- **Remediation:**  
  Enforce strict non-negative validation in `createTicketInvoice` and `createVisaInvoice`:
  ```javascript
  if (cost < 0 || sell < 0) {
    throw new Error('Ticket cost and sell prices cannot be negative numbers.');
  }
  ```

---

### VULN-04: Unrestricted File Upload & Stored XSS via Client Documents
- **Severity:** `HIGH`
- **Location:** [`backend/src/middleware/upload.js:25-28`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/upload.js#L25-L28) & [`backend/src/app.js:64`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/app.js#L64)
- **Description:**  
  Multer disk storage is initialized without a `fileFilter`. Furthermore, `express.static` serves the `./uploads` directory without forced download headers. An authenticated user can upload `.html`, `.svg`, or executable scripts disguised as client KYC/passports.
- **Proof of Concept:**  
  Upload `malicious.html` with payload `<h1>Defaced</h1><script>alert(1)</script>`.  
  Access `http://localhost:5000/uploads/document-xxx.html`.  
  **Result:** The file is served with `Content-Type: text/html` and executes JavaScript in the browser.
- **Remediation:**  
  1. Add a strict whitelist in `fileFilter` allowing only `['image/jpeg', 'image/png', 'application/pdf']`.
  2. Serve uploaded files with `res.setHeader('Content-Disposition', 'attachment; filename="...")` and `Content-Security-Policy: default-src 'none'` so files cannot execute as HTML in the browser.

---

### VULN-05: Unescaped Regular Expression Causes HTTP 500 on Search
- **Severity:** `HIGH`
- **Location:** [`backend/src/controllers/client.controller.js:11`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js#L11) & [`backend/src/controllers/transaction.controller.js:66`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js#L66)
- **Description:**  
  Raw user search strings are passed straight to `new RegExp(search.trim(), 'i')`. Characters like `[`, `(`, `\`, `*`, `+` violate regex grammar:
  ```bash
  GET /api/clients?search=[
  ```
  **Result:** `SyntaxError: Invalid regular expression: /[/i: Unterminated character class` -> Uncaught exception in Express returns HTTP 500. On the frontend, typing a bracket breaks the ledger and client list.
- **Remediation:**  
  Escape regex special characters before compilation:
  ```javascript
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
  ```

---

### VULN-06: Cross-Agency Client ID Fallback Silently Provisions Ghost Clients
- **Severity:** `HIGH`
- **Location:** [`backend/src/services/transaction.service.js:68-84`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L68-L84)
- **Description:**  
  In `resolveClient(clientIdOrName, userId, session, agencyId)`, if `clientIdOrName` is a valid 24-character hexadecimal ObjectId belonging to Agency A, the query `Client.findOne({ _id: clientIdOrName, agency: agencyB })` returns `null`.
  Instead of rejecting the request, the method falls through:
  ```javascript
  const nameUpper = String(clientIdOrName).trim().toUpperCase();
  ```
  It assumes the hex ID is the *client's name*, and executes `Client.create({ name: '6AC7345B5A188076DD218C5E', agency: agencyB })`.
- **Proof of Concept:**  
  Tenant B submits an invoice specifying Agency A's client ID.
  **Result:** A ghost client named `"6AC7345B5A188076DD218C5E"` is automatically minted in Tenant B's database.
- **Remediation:**  
  If `mongoose.Types.ObjectId.isValid(clientIdOrName)`, only check for an existing client by ID. If not found in this agency, return `null` or throw `Error('Client not found in your agency workspace.')`. Do NOT treat ObjectIds as human client names.

---

### VULN-07: Workspace Administrator Can Deactivate Their Own Account
- **Severity:** `HIGH`
- **Location:** [`backend/src/controllers/user.controller.js:93`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js#L93)
- **Description:**  
  `toggleUserStatus` has a safety check: `if (String(user._id) === String(req.user._id)) return res.status(400)`.  
  However, `updateUser` (`PATCH /api/users/:id`) accepts `active: false` without verifying whether the target user is the authenticated caller.
- **Proof of Concept:**
  ```javascript
  PATCH /api/users/<my_admin_id>
  { "active": false }
  ```
  **Result:** HTTP 200 OK. The admin account is deactivated, resulting in instant session termination and permanent administrative lockout for the workspace.
- **Remediation:**  
  Add to `updateUser`:
  ```javascript
  if (active === false && String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: 'You cannot deactivate your own account.' });
  }
  ```

---

### VULN-08: Negative Financial Values via Transaction Edit
- **Severity:** `HIGH`
- **Location:** [`backend/src/services/transaction.service.js:725`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L725)
- **Description:**  
  While `createExpense` blocks zero and negative values (`if (isNaN(numAmount) || numAmount <= 0) throw ...`), `editTransaction` lacks this verification for Expenses:
  ```javascript
  oldTx.amount = Number(newData.amount) || oldTx.amount;
  ```
- **Proof of Concept:**  
  Edit an expense with `{ "amount": -9999 }`.
  **Result:** Accepted with HTTP 200 OK.
- **Remediation:**  
  Add positive number validation in `editTransaction` across all transaction types.

---

### VULN-09: Unsegregated Transaction Void Permissions
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/routes/transaction.routes.js:36`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js#L36)
- **Description:**  
  The void route is configured as:
  ```javascript
  router.post('/:id/void', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleVoidTransaction);
  ```
  Any junior staff member can unilaterally void million-BDT tickets or payments without supervisory approval.
- **Remediation:**  
  Restrict voiding to `requireRole('MANAGER', 'ADMIN')` or introduce a 2-step void request & approval workflow.

---

### VULN-10: Query Parameter Array Crash on Supplier List
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/controllers/supplier.controller.js:10`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/supplier.controller.js#L10)
- **Description:**  
  ```javascript
  if (type) query.type = type.toUpperCase();
  ```
  If a user or script requests `GET /api/suppliers?type[]=PORTAL`, `req.query.type` is an Array (`['PORTAL']`). Calling `.toUpperCase()` on an array throws `TypeError: type.toUpperCase is not a function`.
- **Remediation:**  
  Check type:
  ```javascript
  if (typeof type === 'string') query.type = type.toUpperCase();
  ```

---

### VULN-11: Malformed ObjectId Strings Trigger Unhandled 500 CastErrors
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/controllers/client.controller.js:54`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js#L54), [`supplier.controller.js:23`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/supplier.controller.js#L23), etc.
- **Description:**  
  Calling `Client.findOne({ _id: 'invalid-id' })` throws Mongoose `CastError`. Express uncaught error handler translates this into a 500 Internal Server Error rather than a 400 Bad Request or 404 Not Found.
- **Remediation:**  
  In `errorHandler.js`:
  ```javascript
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Resource not found or invalid identifier.' });
  }
  ```

---

### VULN-12: JWT Session Token in URL Query Parameters
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/middleware/auth.js:17-19`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/middleware/auth.js#L17-L19)
- **Description:**  
  Accepting authentication tokens via `?token=...` exposes credentials in browser history, proxy access logs, and HTTP `Referer` headers when clicking external URLs.
- **Remediation:**  
  Deprecate query string authentication; rely exclusively on `Authorization: Bearer <token>` and HTTP-only cookies.

---

### VULN-13: Missing Rate Limiting on Authentication Endpoints
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/routes/auth.routes.js:10`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/auth.routes.js#L10)
- **Description:**  
  `POST /api/auth/login` has no throttling or rate limiting. An attacker can execute high-speed brute-force and credential stuffing dictionary attacks against tenant accounts without being blocked.
- **Remediation:**  
  Install `express-rate-limit` and apply a strict 5 requests/minute limiter per IP/email on `/api/auth/login`.

---

### VULN-14: Missing Frontend Validation on Passenger Rows Causes 500 Error Toast
- **Severity:** `LOW`
- **Location:** [`frontend/src/pages/InvoicePage.jsx:82-100`](file:///c:/Users/send2/Desktop/SAL%202.0/frontend/src/pages/InvoicePage.jsx#L82-L100) & [`VisaPage.jsx:64-70`](file:///c:/Users/send2/Desktop/SAL%202.0/frontend/src/pages/VisaPage.jsx#L64-L70)
- **Description:**  
  The invoice creation form submits passenger arrays without verifying that `passenger.name` is non-empty. The server Mongoose schema rejects the empty name with a `ValidationError`, which reaches the frontend as an unhandled `500 Internal Server Error` toast rather than showing inline form errors.
- **Remediation:**  
  Validate all passenger rows before calling `mutation.mutate()`, and map server 400 validation errors to specific form fields.

---

## 4. Initial Remediation Summary
All 14 initial vulnerabilities were successfully patched, verified with unit test suites, and committed in commit `7845994`.

---

## 5. Second-Round Testing: Newly Discovered Vulnerabilities & Edge Cases

Following the remediation of the initial 14 items, a second round of exploratory fuzzing, boundary probing, and permission auditing was conducted. 11 additional vulnerabilities and edge cases were discovered and resolved:

### VULN-15: Refunding a Voided Invoice Causes Double Financial Reversal
- **Severity:** `CRITICAL`
- **Location:** [`backend/src/services/transaction.service.js:600-635`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L600-L635)
- **Description:**  
  When an invoice was voided, its financial effect was fully reversed (`applyEffect(oldTx, -1)`). However, `createRefund` did not verify the parent invoice's status (`ACTIVE` vs `VOIDED`). Issuing a refund on a voided invoice resulted in double deduction of client due and double crediting of supplier wallets.
- **Remediation:**  
  Assert `if (parent.status !== 'ACTIVE') throw new Error('Cannot refund a voided or inactive transaction.');`

---

### VULN-16: Uncapped, Negative, or Excessive Refund Amounts
- **Severity:** `CRITICAL`
- **Location:** [`backend/src/services/transaction.service.js:615-645`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L615-L645)
- **Description:**  
  Refund requests accepted negative numbers (which increased customer debt) or amounts exceeding the parent invoice price. Multiple partial refunds could also cumulatively exceed the invoice total sell price.
- **Remediation:**  
  Enforced non-negative amount checks and checked active cumulative refunds against `parent.totalSell` and `parent.totalBuy`.

---

### VULN-17: Voiding an Invoice with Active Refunds Attached
- **Severity:** `HIGH`
- **Location:** [`backend/src/services/transaction.service.js:845-865`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L845-L865)
- **Description:**  
  If a customer was granted a partial refund, voiding the parent invoice would reverse the full invoice total without accounting for the active refund, resulting in client balance corruption.
- **Remediation:**  
  Blocked voiding of parent invoices if active linked refunds exist: `Cannot void invoice ... because it has active refund(s) attached. Please void associated refunds first.`

---

### VULN-18: Profit Reports Silently Ignored `airlineId` and `sectorId` Filters
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/services/report.service.js:235-370`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/report.service.js#L235-L370)
- **Description:**  
  `getTicketProfitReport` and `getVisaProfitReport` accepted `airlineId` and `sectorId` query parameters, but never added them to the Mongoose query. Filtering by airline or sector returned all invoices across all airlines/sectors.
- **Remediation:**  
  Added `query['passengers.airline'] = airlineId` and `query['passengers.sector'] = sectorId`, and filtered passenger rows to compute accurate profit and passenger metrics.

---

### VULN-19: Bcrypt CPU Starvation via Giant Password Payloads (>128 chars)
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/controllers/auth.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/auth.controller.js) and [`user.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js)
- **Description:**  
  Submitting excessively long passwords (5,000+ characters) caused Node.js threadpool exhaustion during Bcrypt hashing/comparison.
- **Remediation:**  
  Fast-rejected passwords exceeding 128 characters with HTTP 400 Bad Request before calling bcrypt functions.

---

### VULN-20: Uncaught `ReferenceError: before is not defined` in `updateUser`
- **Severity:** `HIGH`
- **Location:** [`backend/src/controllers/user.controller.js:114`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/user.controller.js#L114)
- **Description:**  
  `writeAuditLog` referenced `before`, but `const before = user.toObject()` was never declared, crashing `PATCH /api/users/:id` with HTTP 500.
- **Remediation:**  
  Captured `const before = user.toObject();` immediately after fetching the user.

---

### VULN-21: Expense Creation with Unverified / Foreign `categoryId`
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/services/transaction.service.js:560-575`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L560-L575)
- **Description:**  
  `createExpense` accepted arbitrary `categoryId` values without verifying their existence or tenant ownership.
- **Remediation:**  
  Validated `categoryId` against `ExpenseCategory` with tenant isolation check (`agency: req.agencyId`).

---

### VULN-22: Supplier Deposits / Payments on DIRECT In-House Suppliers
- **Severity:** `MEDIUM`
- **Location:** [`backend/src/services/transaction.service.js:485-500`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/services/transaction.service.js#L485-L500)
- **Description:**  
  Creating supplier payments or deposits for suppliers flagged as `isSelf: true` or `type: 'DIRECT'` created orphan transactions without balance adjustments.
- **Remediation:**  
  Rejected supplier transactions on direct in-house suppliers with 400 Bad Request.

---

### VULN-23: Unauthorized Financial Transaction Modification by `STAFF` Role
- **Severity:** `HIGH`
- **Location:** [`backend/src/routes/transaction.routes.js:35`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/routes/transaction.routes.js#L35)
- **Description:**  
  `PATCH /api/transactions/:id` allowed `STAFF` members to modify already-posted financial transactions.
- **Remediation:**  
  Restricted editing to `requireRole('MANAGER', 'ADMIN')`.

---

### VULN-24: Uncapped Pagination Limits (`?limit=1000000`)
- **Severity:** `LOW`
- **Location:** [`transaction.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js), [`client.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/client.controller.js), [`audit.controller.js`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/audit.controller.js)
- **Description:**  
  Passing unbounded `limit` values loaded entire collections into memory, threatening Node.js heap exhaustion.
- **Remediation:**  
  Enforced `Math.min(100, Math.max(1, limit))`.

---

### VULN-25: Multi-Type Query Parameter Array Support
- **Severity:** `LOW`
- **Location:** [`backend/src/controllers/transaction.controller.js:40-46`](file:///c:/Users/send2/Desktop/SAL%202.0/backend/src/controllers/transaction.controller.js#L40-L46)
- **Description:**  
  `listTransactions` expected comma-delimited strings for `type` and failed when passed arrays like `?type[]=TICKET_INVOICE&type[]=VISA_INVOICE`.
- **Remediation:**  
  Added support for both array and comma-separated string inputs.
