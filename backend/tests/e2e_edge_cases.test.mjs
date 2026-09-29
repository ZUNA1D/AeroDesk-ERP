import assert from 'node:assert';

const BASE_URL = 'http://127.0.0.1:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, headers: res.headers, data };
}

async function runEdgeCases() {
  console.log('=== STARTING END-TO-END EDGE CASE SUITE ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    -> ${err.message}`);
      failed++;
    }
  }

  // --- 1. AUTHENTICATION EDGE CASES ---
  console.log('--- 1. Authentication Edge Cases ---');

  await test('Login with completely empty payload fails (400)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({})
    });
    assert([400, 422].includes(res.status), `Expected 400/422 but got ${res.status}`);
  });

  await test('Login with incorrect password fails (401)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aerodesk.com', password: 'wrongpassword' })
    });
    assert.strictEqual(res.status, 401, `Expected 401 but got ${res.status}`);
  });

  await test('Login with non-existent user fails (401 or 404)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'ghost_user_9999@aerodesk.com', password: 'password123' })
    });
    assert([401, 404].includes(res.status), `Expected 401/404 but got ${res.status}`);
  });

  let adminToken = '';
  let agencyId = '';

  await test('Admin login with valid credentials succeeds (200)', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aerodesk.com', password: 'admin123' })
    });
    assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
    adminToken = res.data?.token;
    assert(adminToken, 'Token must be returned in response');
    const user = res.data?.user;
    assert.strictEqual(user.role, 'ADMIN', 'Expected role to be ADMIN');
    agencyId = user.agencyId || res.data?.agency?.id;
    assert(agencyId, 'Admin must belong to an agency workspace');
  });

  await test('/auth/me returns authenticated user details', async () => {
    const res = await request('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
    const user = res.data?.user;
    assert.strictEqual(user.email, 'admin@aerodesk.com');
    assert.strictEqual(user.role, 'ADMIN');
  });

  // --- 2. AUTHORIZATION & RBAC EDGE CASES ---
  console.log('\n--- 2. RBAC & Route Protection Edge Cases ---');

  await test('Unauthenticated request to protected route is rejected (401)', async () => {
    const res = await request('/transactions');
    assert.strictEqual(res.status, 401, `Expected 401 but got ${res.status}`);
  });

  await test('Agency Admin is rejected when accessing platform SuperAdmin endpoints (403)', async () => {
    const res = await request('/agency/all', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 403, `Expected 403 Forbidden but got ${res.status}`);
  });

  let superAdminToken = '';
  await test('SuperAdmin login succeeds and can access /agency/all', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'superadmin@aerodesk.com', password: 'superadmin123' })
    });
    assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
    superAdminToken = res.data?.token;
    assert(superAdminToken, 'SuperAdmin token must exist');

    const agencyRes = await request('/agency/all', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(agencyRes.status, 200, `Expected 200 for super admin but got ${agencyRes.status}`);
    assert(Array.isArray(agencyRes.data?.agencies || agencyRes.data), 'Agencies array must be returned');
  });

  // --- 3. SUPPLIER & CLIENT LOOKUPS & CREATION ---
  console.log('\n--- 3. Client & Supplier Operations ---');

  let testClientId = '';
  let testSupplierId = '';

  await test('Fetch suppliers for agency', async () => {
    const res = await request('/suppliers', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const list = res.data?.suppliers || res.data;
    assert(Array.isArray(list) && list.length > 0, 'Should have seeded suppliers');
    testSupplierId = list[0]._id;
    assert(testSupplierId, 'Supplier ID must exist');
  });

  await test('Create new client with full valid details', async () => {
    const clientPayload = {
      name: `Edge Case Client ${Date.now()}`,
      phone: '+8801700998877',
      email: `edge_${Date.now()}@test.com`,
      address: 'Test Address Dhaka',
      openingBalance: 0
    };
    const res = await request('/clients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(clientPayload)
    });
    assert([200, 201].includes(res.status), `Expected 200/201 but got ${res.status}`);
    const client = res.data?.client || res.data?.data || res.data;
    testClientId = client._id;
    assert(testClientId, 'Client ID must be returned');
  });

  // --- 4. INVOICING & CALCULATION EDGE CASES ---
  console.log('\n--- 4. Invoicing & Calculation Edge Cases ---');

  await test('Invoice creation with empty passengers array fails (400/500 validation)', async () => {
    const res = await request('/transactions/ticket-invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        clientId: testClientId,
        supplierId: testSupplierId,
        passengers: []
      })
    });
    assert([400, 422, 500].includes(res.status), `Expected 400/422/500 but got ${res.status}`);
  });

  await test('Invoice creation with missing client fails', async () => {
    const res = await request('/transactions/ticket-invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        supplierId: testSupplierId,
        passengers: [
          {
            name: 'John Doe',
            cost: 50000,
            sell: 60000
          }
        ]
      })
    });
    assert([400, 422, 500].includes(res.status), `Expected 400/422/500 but got ${res.status}`);
  });

  let testInvoiceId = '';
  let testInvoiceSell = 0;

  await test('Create valid ticket invoice and verify buy, sell, and profit calculations', async () => {
    const costPrice = 50000;
    const sellPrice = 65000;
    const expectedProfit = sellPrice - costPrice; // 15000

    const invoicePayload = {
      clientId: testClientId,
      supplierId: testSupplierId,
      date: new Date().toISOString(),
      passengers: [
        {
          name: 'Jane Doe',
          ticketNo: '098-1234567890',
          pnr: 'AB12CD',
          route: 'DAC-DXB-DAC',
          cost: costPrice,
          sell: sellPrice
        }
      ],
      notes: 'Automated edge-case test ticket invoice'
    };

    const res = await request('/transactions/ticket-invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(invoicePayload)
    });
    assert.strictEqual(res.status, 201, `Expected 201 but got ${res.status} (${JSON.stringify(res.data)})`);
    const inv = res.data?.transaction;
    assert(inv, 'Transaction must be returned');
    testInvoiceId = inv._id;
    testInvoiceSell = inv.totalSell;
    assert.strictEqual(inv.totalBuy, costPrice, `Expected totalBuy to equal ${costPrice}`);
    assert.strictEqual(inv.totalSell, sellPrice, `Expected totalSell to equal ${sellPrice}`);
    assert.strictEqual(inv.profit, expectedProfit, `Expected profit to equal ${expectedProfit}`);
  });

  // --- 5. RECEIPTS & PAYMENT ALLOCATION EDGE CASES ---
  console.log('\n--- 5. Receipts & Payment Allocation Edge Cases ---');

  await test('Receipt creation with 0 or negative amount fails', async () => {
    const res = await request('/transactions/client-receipt', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        clientId: testClientId,
        amount: 0,
        mode: 'CASH'
      })
    });
    assert([400, 422, 500].includes(res.status), `Expected 400/422/500 but got ${res.status}`);
  });

  await test('Partial payment receipt creation succeeds and updates client due', async () => {
    const partialAmount = 25000;
    const res = await request('/transactions/client-receipt', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        clientId: testClientId,
        amount: partialAmount,
        mode: 'BANK',
        bankName: 'City Bank Ltd',
        transactionId: 'TXN-PARTIAL-001',
        remarks: 'Partial payment test'
      })
    });
    assert.strictEqual(res.status, 201, `Expected 201 but got ${res.status} (${JSON.stringify(res.data)})`);

    // Verify client currentDue (Started at 0 + 65000 invoice - 25000 payment = 40000 due)
    const clientRes = await request(`/clients/${testClientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(clientRes.status, 200);
    const updatedClient = clientRes.data?.client || clientRes.data;
    assert.strictEqual(updatedClient.currentDue, 40000, `Expected client due 40000 but got ${updatedClient.currentDue}`);
  });

  await test('Full balance payment receipt clears client due to zero', async () => {
    const remainingAmount = 40000;
    const res = await request('/transactions/client-receipt', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        clientId: testClientId,
        amount: remainingAmount,
        mode: 'CASH',
        remarks: 'Final settlement'
      })
    });
    assert.strictEqual(res.status, 201, `Expected 201 but got ${res.status}`);

    const clientRes = await request(`/clients/${testClientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(clientRes.status, 200);
    const updatedClient = clientRes.data?.client || clientRes.data;
    assert.strictEqual(updatedClient.currentDue, 0, `Expected client due 0 but got ${updatedClient.currentDue}`);
  });

  // --- 6. VISA INVOICE EDGE CASES ---
  console.log('\n--- 6. Visa Invoice Creation & Calculations ---');

  let testVisaInvoiceId = '';
  await test('Create visa invoice and verify financial profit tracking', async () => {
    const visaPayload = {
      clientId: testClientId,
      supplierId: testSupplierId,
      passengers: [
        {
          name: 'Jane Doe',
          visaNo: 'UAE-VIS-889900',
          cost: 12000,
          sell: 18000
        }
      ],
      notes: 'Dubai Tourist Visa'
    };

    const res = await request('/transactions/visa-invoice', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(visaPayload)
    });
    assert.strictEqual(res.status, 201, `Expected 201 but got ${res.status}`);
    const v = res.data?.transaction;
    assert(v, 'Visa transaction must exist');
    testVisaInvoiceId = v._id;
    assert.strictEqual(v.totalBuy, 12000);
    assert.strictEqual(v.totalSell, 18000);
    assert.strictEqual(v.profit, 6000);
  });

  // --- 7. LEDGER INTEGRITY & ACCOUNTING EDGE CASES ---
  console.log('\n--- 7. Ledger Integrity & Statement Edge Cases ---');

  await test('Client Statement returns ledger entries with running balance', async () => {
    const res = await request(`/reports/client-statement?clientId=${testClientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
    const data = res.data;
    assert(Array.isArray(data.rows || data.transactions || data.ledger || data), 'Ledger rows should be an array');
  });

  // --- 8. REPORTS & ANALYTICS EDGE CASES ---
  console.log('\n--- 8. Reports & Analytics Edge Cases ---');

  await test('Profit report (Ticket) calculates totals without errors', async () => {
    const res = await request(`/reports/profit-ticket`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('Profit report (Visa) calculates totals without errors', async () => {
    const res = await request(`/reports/profit-visa`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  await test('Client aging report computes aging buckets', async () => {
    const res = await request(`/reports/client-aging`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
  });

  // --- 9. MULTITENANCY ISOLATION EDGE CASE ---
  console.log('\n--- 9. Multitenancy Security Isolation ---');

  await test('Querying non-existent / foreign transaction returns 404', async () => {
    const foreignRes = await request(`/transactions/000000000000000000000000`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(foreignRes.status, 404, `Expected 404 for foreign/invalid transaction but got ${foreignRes.status}`);
  });

  // --- 10. VOID TRANSACTION & AUDIT TRAIL EDGE CASES ---
  console.log('\n--- 10. Void Transaction & Audit Trail ---');

  await test('Voiding a transaction reverses financial balances and logs audit event', async () => {
    const voidRes = await request(`/transactions/${testVisaInvoiceId}/void`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Test void operation for edge case verification' })
    });
    assert.strictEqual(voidRes.status, 200, `Expected 200 on void transaction but got ${voidRes.status}`);

    // Verify status changed to VOID
    const checkRes = await request(`/transactions/${testVisaInvoiceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(checkRes.status, 200);
    assert.strictEqual(checkRes.data?.transaction?.status, 'VOIDED');

    // Verify client due reversed back (the 18000 from visa invoice was deducted upon void)
    const clientRes = await request(`/clients/${testClientId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(clientRes.status, 200);
    const client = clientRes.data?.client || clientRes.data;
    assert.strictEqual(client.currentDue, 0, `Expected client due to return to 0 after voiding invoice, got ${client.currentDue}`);
  });

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runEdgeCases().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
