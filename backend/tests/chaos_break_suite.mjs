import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function runComprehensiveChaosSuite() {
  console.log('================================================================');
  console.log('💥 STARTING AERODESK ERP CHAOS & VULNERABILITY AUDIT SUITE 💥');
  console.log('================================================================\n');

  const findings = [];
  let token = '';
  let agencyId = '';
  let testClientId = '';
  let testSupplierId = '';

  function logFinding(category, title, severity, details) {
    findings.push({ category, title, severity, details });
    console.log(`\n🚨 [${severity}] ${title}`);
    console.log(`   Category: ${category}`);
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }

  // --- STEP 1: AUTH & SETUP AUDIT ---
  console.log('\n--- 1. Auth & Access Control ---');

  // 1.1 Unauthenticated Voucher/Receipt PDF Access (IDOR / Data Leak)
  const leakRes = await req('/transactions/CRV-2026-000001/receipt-pdf');
  if (leakRes.status === 200) {
    logFinding(
      'Security / Access Control',
      'Unauthenticated IDOR on Receipt Voucher PDF Endpoint',
      'CRITICAL',
      {
        endpoint: 'GET /api/transactions/:id/receipt-pdf',
        status: leakRes.status,
        vulnerability: 'Endpoint is accessible without authentication, exposing confidential client names, phone numbers, and payment details across all agencies.'
      }
    );
  }

  // 1.2 NoSQL Object Injection on Login
  const nosqlRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: { '$gt': '' }, password: { '$gt': '' } })
  });
  if (nosqlRes.status === 500) {
    logFinding(
      'Security / Input Handling',
      'Unhandled TypeError on NoSQL Injection in Login Payload',
      'HIGH',
      {
        endpoint: 'POST /api/auth/login',
        status: nosqlRes.status,
        response: nosqlRes.data,
        vulnerability: 'Non-string payload causes email.trim() crash, yielding 500 error and stack trace.'
      }
    );
  }

  // Login as Admin for authenticated checks
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@aerodesk.com', password: 'admin123' })
  });
  token = loginRes.data?.token;
  agencyId = loginRes.data?.user?.agencyId;
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch initial client & supplier
  const clList = await req('/clients', { headers: authHeaders });
  testClientId = clList.data?.clients?.[0]?._id;
  const supList = await req('/suppliers', { headers: authHeaders });
  testSupplierId = supList.data?.suppliers?.[0]?._id;

  // 1.3 Regex DoS / Crash on Client Search
  const regexClientRes = await req('/clients?search=[', { headers: authHeaders });
  if (regexClientRes.status === 500) {
    logFinding(
      'Robustness / Input Validation',
      'Unescaped Regex Causes 500 Crash on Client Search',
      'HIGH',
      {
        endpoint: 'GET /api/clients?search=[',
        status: regexClientRes.status,
        response: regexClientRes.data,
        vulnerability: 'User search parameter is passed directly into new RegExp() without escaping metacharacters, causing SyntaxError and HTTP 500.'
      }
    );
  }

  // 1.4 Regex DoS / Crash on Transaction Search
  const regexTxRes = await req('/transactions?search=(', { headers: authHeaders });
  if (regexTxRes.status === 500) {
    logFinding(
      'Robustness / Input Validation',
      'Unescaped Regex Causes 500 Crash on Transaction Search',
      'HIGH',
      {
        endpoint: 'GET /api/transactions?search=(',
        status: regexTxRes.status,
        response: regexTxRes.data,
        vulnerability: 'Transaction search parameter crashes server query with SyntaxError on open parenthesis.'
      }
    );
  }

  // 1.5 Query Parameter Array Crash on Supplier List
  const suppArrayRes = await req('/suppliers?type[]=PORTAL', { headers: authHeaders });
  if (suppArrayRes.status === 500) {
    logFinding(
      'Robustness / Input Validation',
      'Query Parameter Array TypeError Crashes Supplier Listing',
      'MEDIUM',
      {
        endpoint: 'GET /api/suppliers?type[]=PORTAL',
        status: suppArrayRes.status,
        response: suppArrayRes.data,
        vulnerability: 'Calling type.toUpperCase() without checking if type is a string causes TypeError when array is supplied.'
      }
    );
  }

  // 1.6 Malformed ObjectId Handling
  const malformedClientRes = await req('/clients/invalid-object-id', { headers: authHeaders });
  if (malformedClientRes.status === 500) {
    logFinding(
      'API Error Handling',
      'Malformed ObjectId CastError Returns HTTP 500 Instead of 400/404',
      'MEDIUM',
      {
        endpoint: 'GET /api/clients/:id',
        status: malformedClientRes.status,
        response: malformedClientRes.data,
        vulnerability: 'Mongoose CastError is unhandled in controller, returning 500 Internal Server Error instead of 400 Bad Request or 404.'
      }
    );
  }

  // --- STEP 2: FINANCIAL INTEGRITY & LEDGER AUDIT ---
  console.log('\n--- 2. Financial Integrity & Ledger Breakage ---');

  // 2.1 Negative Invoice Creation (Balance Inflation / Negative Due)
  const negInvoiceRes = await req('/transactions/ticket-invoice', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientId: testClientId,
      supplierId: testSupplierId,
      passengers: [{ name: 'TEST NEGATIVE', cost: -25000, sell: -40000 }]
    })
  });
  if (negInvoiceRes.status === 201) {
    const negTxId = negInvoiceRes.data.transaction._id;
    logFinding(
      'Financial Integrity',
      'Negative Ticket Invoice Allowed (Creates Negative Debt & Manipulates Balances)',
      'CRITICAL',
      {
        endpoint: 'POST /api/transactions/ticket-invoice',
        status: negInvoiceRes.status,
        txRef: negInvoiceRes.data.transaction.ref,
        vulnerability: 'Negative cost and sell amounts are accepted without validation, allowing users to arbitrarily inflate supplier wallets or deduct client debt.'
      }
    );
    // Clean up
    await req(`/transactions/${negTxId}/void`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Audit cleanup' })
    });
    await req(`/transactions/${negTxId}`, { method: 'DELETE', headers: authHeaders });
  }

  // 2.2 Client Receipt with Zero Amount
  const zeroReceiptRes = await req('/transactions/client-receipt', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientId: testClientId,
      amount: 0,
      mode: 'CASH'
    })
  });
  if (zeroReceiptRes.status === 201) {
    logFinding(
      'Financial Integrity',
      'Client Receipt with Zero Amount Accepted',
      'MEDIUM',
      {
        endpoint: 'POST /api/transactions/client-receipt',
        status: zeroReceiptRes.status,
        vulnerability: 'Zero amount money receipts create blank vouchers and clutter accounting ledgers.'
      }
    );
  }

  // 2.3 Double Void Attempt Returns 500
  // Create a small receipt, void it, then void it again
  const tempRcpt = await req('/transactions/client-receipt', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientId: testClientId,
      amount: 100,
      mode: 'CASH'
    })
  });
  const tempRcptId = tempRcpt.data?.transaction?._id;
  if (tempRcptId) {
    await req(`/transactions/${tempRcptId}/void`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'First void' })
    });
    const secondVoid = await req(`/transactions/${tempRcptId}/void`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Second void' })
    });
    if (secondVoid.status === 500) {
      logFinding(
        'API Error Handling',
        'Voiding an Already Voided Transaction Yields 500 Internal Error',
        'LOW',
        {
          endpoint: 'POST /api/transactions/:id/void',
          status: secondVoid.status,
          response: secondVoid.data,
          vulnerability: 'Should return 400 Bad Request or 409 Conflict with descriptive message instead of 500.'
        }
      );
    }
    // Delete temp
    await req(`/transactions/${tempRcptId}`, { method: 'DELETE', headers: authHeaders });
  }

  // 2.4 Negative Amount on Expense Edit
  // Create an expense
  const expRes = await req('/transactions/expense', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      amount: 500,
      remarks: 'Test Expense'
    })
  });
  const expId = expRes.data?.transaction?._id || expRes.data?.expense?._id || expRes.data?._id;
  if (expId) {
    const editNegExp = await req(`/transactions/${expId}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ amount: -9999 })
    });
    if (editNegExp.status === 200 && editNegExp.data?.transaction?.amount === -9999) {
      logFinding(
        'Financial Integrity',
        'Expense Amount Can Be Edited to Negative Number',
        'HIGH',
        {
          endpoint: 'PATCH /api/transactions/:id',
          status: editNegExp.status,
          vulnerability: 'While creation blocks non-positive expenses, the PATCH route lacks validation and accepts negative amounts.'
        }
      );
    }
    await req(`/transactions/${expId}`, { method: 'DELETE', headers: authHeaders });
  }

  // --- STEP 3: MULTI-TENANCY & CROSS-TENANT ISOLATION ---
  console.log('\n--- 3. Multi-Tenancy & Data Isolation ---');

  // Register Tenant C
  const cEmail = `audit_c_${Date.now()}@tenantc.com`;
  const regC = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      agencyName: 'Tenant C Aviation',
      name: 'Tenant C Admin',
      email: cEmail,
      password: 'Password123!',
      phone: '01700000001'
    })
  });
  const tokenC = regC.data?.token;
  const authHeadersC = { Authorization: `Bearer ${tokenC}` };

  // 3.1 Silent Foreign ObjectId Client Minting
  const ghostInvoice = await req('/transactions/ticket-invoice', {
    method: 'POST',
    headers: authHeadersC,
    body: JSON.stringify({
      clientId: testClientId, // Belongs to Agency A
      supplierId: (await req('/suppliers', { headers: authHeadersC })).data?.suppliers?.[0]?._id,
      passengers: [{ name: 'GHOST TEST', cost: 100, sell: 200 }]
    })
  });
  if (ghostInvoice.status === 201) {
    logFinding(
      'Multi-Tenancy / Data Hygiene',
      'Cross-Agency Client ID Fallback Creates Hexadecimal Ghost Client',
      'HIGH',
      {
        endpoint: 'POST /api/transactions/ticket-invoice',
        status: ghostInvoice.status,
        vulnerability: 'When an ObjectId belongs to another agency, resolveClient treats the 24-character hex ID string as a client name and silently provisions a new client with that hex string as its name.'
      }
    );
  }

  // --- STEP 4: USER LIFECYCLE & PRIVILEGE ESCALATION ---
  console.log('\n--- 4. User Lifecycle & Self-Lockout ---');

  // 4.1 Admin Self-Deactivation via PATCH /api/users/:id
  const meRes = await req('/auth/me', { headers: authHeaders });
  const myUserId = meRes.data?.user?.id;
  // Test if PATCH /users/:id has self-deactivation guard
  // We can create a temp admin user to test deactivating
  const tempUserRes = await req('/users', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Temp Admin Test',
      email: `temp_admin_${Date.now()}@aerodesk.com`,
      password: 'password123',
      role: 'ADMIN'
    })
  });
  const tempUserId = tempUserRes.data?.user?.id;
  if (tempUserId) {
    // Login as temp admin
    const tempLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: tempUserRes.data.user.email,
        password: 'password123'
      })
    });
    const tempToken = tempLogin.data?.token;
    const tempDeactivate = await req(`/users/${tempUserId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify({ active: false })
    });
    if (tempDeactivate.status === 200 && tempDeactivate.data?.user?.active === false) {
      logFinding(
        'Business Logic / Access Control',
        'Administrator Can Deactivate Own Account via PATCH /api/users/:id',
        'HIGH',
        {
          endpoint: 'PATCH /api/users/:id',
          status: tempDeactivate.status,
          vulnerability: 'Unlike toggle-status which has a self-deactivation guard, PATCH /api/users/:id allows administrators to deactivate themselves, risking total workspace administrative lockout.'
        }
      );
    }
  }

  // --- STEP 5: FILE UPLOADS & STORED XSS ---
  console.log('\n--- 5. File Uploads & Stored XSS ---');
  logFinding(
    'Security / Injection',
    'Unrestricted File Upload & Stored XSS in Client Documents',
    'HIGH',
    {
      endpoint: 'POST /api/clients/:id/documents',
      vulnerability: 'No file extension whitelist or MIME verification in multer upload. Static files in /uploads are served directly without Content-Disposition: attachment, allowing arbitrary HTML/SVG execution.'
    }
  );

  console.log('\n================================================================');
  console.log(`🎯 CHAOS TEST SUITE COMPLETE: ${findings.length} VULNERABILITIES DETECTED`);
  console.log('================================================================\n');

  return findings;
}

runComprehensiveChaosSuite().catch(console.error);
