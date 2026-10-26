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

async function runNewVerification() {
  console.log('================================================================');
  console.log('🛡️  VERIFYING REMEDIATION OF NEW VULNERABILITIES & EDGE CASES 🛡️');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(id, title, fn) {
    try {
      await fn();
      console.log(`✅ [FIXED] ${id}: ${title}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAILED] ${id}: ${title}`);
      console.error(`   -> ${err.message}`);
      failed++;
    }
  }

  // 1. Authenticate as Admin
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@aerodesk.com', password: 'admin123' })
  });
  const token = loginRes.data?.token;
  assert(token, 'Admin login token acquired');
  const authHeaders = { Authorization: `Bearer ${token}` };

  // Fetch a valid supplier
  const suppRes = await req('/suppliers', { headers: authHeaders });
  const suppliers = suppRes.data.suppliers;
  const regularSupplier = suppliers.find(s => !s.isSelf && s.type !== 'DIRECT') || suppliers[0];
  const directSupplier = suppliers.find(s => s.isSelf || s.type === 'DIRECT');

  // VULN-15: Block Refunding a VOIDED Invoice
  await check('VULN-15', 'Refunding a VOIDED invoice is blocked with 400', async () => {
    // Create an invoice
    const invRes = await req('/transactions/ticket-invoice', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientName: 'VOID REFUND TARGET CLIENT',
        supplierId: regularSupplier._id,
        passengers: [{ name: 'TEST PASSENGER', cost: 400, sell: 800 }]
      })
    });
    const invoiceId = invRes.data.transaction._id;

    // Void the invoice
    await req(`/transactions/${invoiceId}/void`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Test voiding' })
    });

    // Try refunding
    const refRes = await req('/transactions/refund', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parentTransactionId: invoiceId,
        clientRefundAmount: 400,
        supplierRefundAmount: 200,
        reason: 'Refund on voided invoice'
      })
    });

    assert.equal(refRes.status, 400, `Expected 400 Bad Request, got ${refRes.status}`);
    assert(
      refRes.data.message.includes('Cannot refund a voided') || refRes.data.message.includes('inactive'),
      `Expected error message about voided parent, got: ${refRes.data.message}`
    );

    // Clean up
    await req(`/transactions/${invoiceId}`, { method: 'DELETE', headers: authHeaders });
  });

  // VULN-16: Block Negative and Excessive Refunds
  await check('VULN-16', 'Negative and Excessive Refunds (> totalSell) are rejected with 400', async () => {
    const invRes = await req('/transactions/ticket-invoice', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientName: 'REFUND BOUNDS CLIENT',
        supplierId: regularSupplier._id,
        passengers: [{ name: 'BOUNDS PASSENGER', cost: 500, sell: 1000 }]
      })
    });
    const invoiceId = invRes.data.transaction._id;

    // Test negative refund
    const negRes = await req('/transactions/refund', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parentTransactionId: invoiceId,
        clientRefundAmount: -500,
        supplierRefundAmount: 100,
        reason: 'Negative refund attempt'
      })
    });
    assert.equal(negRes.status, 400, `Expected 400 for negative refund, got ${negRes.status}`);

    // Test excessive refund (> 1000 sell)
    const excessRes = await req('/transactions/refund', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parentTransactionId: invoiceId,
        clientRefundAmount: 1500,
        supplierRefundAmount: 300,
        reason: 'Excessive refund attempt'
      })
    });
    assert.equal(excessRes.status, 400, `Expected 400 for excessive refund, got ${excessRes.status}`);

    // Clean up
    await req(`/transactions/${invoiceId}`, { method: 'DELETE', headers: authHeaders });
  });

  // VULN-17: Block Voiding Invoice with Active Refunds Attached
  await check('VULN-17', 'Voiding an invoice that has active refunds attached is blocked with 400', async () => {
    const invRes = await req('/transactions/ticket-invoice', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientName: 'INVOICE WITH REFUND CLIENT',
        supplierId: regularSupplier._id,
        passengers: [{ name: 'REFUNDED PASSENGER', cost: 600, sell: 1200 }]
      })
    });
    const invoiceId = invRes.data.transaction._id;

    // Create an active partial refund
    const refRes = await req('/transactions/refund', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parentTransactionId: invoiceId,
        clientRefundAmount: 300,
        supplierRefundAmount: 200,
        reason: 'Legitimate partial refund'
      })
    });
    assert.equal(refRes.status, 201, 'Refund created successfully');
    const refundId = refRes.data.transaction._id;

    // Now try to void the parent invoice!
    const voidRes = await req(`/transactions/${invoiceId}/void`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Attempting void on invoice with active refunds' })
    });

    assert.equal(voidRes.status, 400, `Expected 400 Bad Request, got ${voidRes.status}`);
    assert(
      voidRes.data.message.includes('active refund'),
      `Expected message about active refunds, got: ${voidRes.data.message}`
    );

    // Clean up
    await req(`/transactions/${refundId}`, { method: 'DELETE', headers: authHeaders });
    await req(`/transactions/${invoiceId}`, { method: 'DELETE', headers: authHeaders });
  });

  // VULN-18: Profit Report Filters by Airline
  await check('VULN-18', 'Ticket profit report strictly respects airlineId filter', async () => {
    const airlinesRes = await req('/airlines', { headers: authHeaders });
    const airlines = airlinesRes.data.airlines;
    if (airlines && airlines.length > 0) {
      const targetAirline = airlines[0];
      const otherAirlineId = '507f1f77bcf86cd799439011'; // Non-existent airline ID

      const reportRes = await req(`/reports/profit-ticket?airlineId=${otherAirlineId}`, {
        headers: authHeaders
      });
      assert.equal(reportRes.status, 200, 'Report returned 200');
      assert.equal(reportRes.data.rows.length, 0, 'No rows should match non-existent airline ID');
      assert.equal(reportRes.data.summary.totalPax, 0, 'Total pax must be 0 for unmatched airline');
    }
  });

  // VULN-19: Bcrypt CPU Starvation via Giant Password (>128 chars)
  await check('VULN-19', 'Passwords exceeding 128 chars are fast rejected with 400 without CPU hang', async () => {
    const giantPassword = 'X'.repeat(5000);
    const start = Date.now();
    const loginAttempt = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@aerodesk.com', password: giantPassword })
    });
    const elapsed = Date.now() - start;

    assert.equal(loginAttempt.status, 400, `Expected 400 Bad Request, got ${loginAttempt.status}`);
    assert(elapsed < 200, `Password check took ${elapsed}ms, should fast reject in <200ms`);
  });

  // VULN-20: User Update ReferenceError
  await check('VULN-20', 'User update completes with 200 without ReferenceError: before is not defined', async () => {
    const meRes = await req('/auth/me', { headers: authHeaders });
    const me = meRes.data.user;

    const updateRes = await req(`/users/${me.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ name: 'AeroDesk Administrator Verified' })
    });

    assert.equal(updateRes.status, 200, `Expected 200 OK, got ${updateRes.status}: ${JSON.stringify(updateRes.data)}`);
    assert.equal(updateRes.data.user.name, 'AeroDesk Administrator Verified');
  });

  // VULN-21: Expense Category Validation
  await check('VULN-21', 'Expense creation with invalid or foreign categoryId is rejected (400/404)', async () => {
    const fakeCatId = '507f1f77bcf86cd799439011';
    const expRes = await req('/transactions/expense', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 1200,
        categoryId: fakeCatId,
        remarks: 'Test non-existent category'
      })
    });

    assert(expRes.status === 400 || expRes.status === 404, `Expected 400 or 404, got ${expRes.status}`);
    assert(expRes.data.message.includes('Expense category not found'));
  });

  // VULN-22: Direct Supplier Balance Protection
  await check('VULN-22', 'Supplier deposits/payments on DIRECT in-house suppliers are rejected with 400', async () => {
    if (directSupplier) {
      const depRes = await req('/transactions/supplier-txn', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          supplierId: directSupplier._id,
          amount: 5000,
          type: 'SUPPLIER_DEPOSIT'
        })
      });

      assert.equal(depRes.status, 400, `Expected 400 Bad Request, got ${depRes.status}`);
      assert(depRes.data.message.includes('DIRECT / in-house stock'));
    }
  });

  // VULN-23: Restrict Transaction Editing to MANAGER/ADMIN
  await check('VULN-23', 'Staff role is forbidden (403) from editing financial transactions', async () => {
    // Create an invoice as admin
    const invRes = await req('/transactions/ticket-invoice', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientName: 'STAFF PERMISSION TARGET',
        supplierId: regularSupplier._id,
        passengers: [{ name: 'STAFF TARGET PAX', cost: 200, sell: 400 }]
      })
    });
    const invoiceId = invRes.data.transaction._id;

    // Login as a staff user
    const staffLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'staff@aerodesk.com', password: 'admin123' })
    });

    let staffToken = staffLoginRes.data?.token;
    if (!staffToken) {
      // Create staff if needed
      const createStaff = await req('/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'Front Desk Staff',
          email: 'staff_test_audit@aerodesk.com',
          password: 'Password123!',
          role: 'STAFF'
        })
      });
      const loginStaff = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'staff_test_audit@aerodesk.com', password: 'Password123!' })
      });
      staffToken = loginStaff.data.token;
    }

    const staffHeaders = { Authorization: `Bearer ${staffToken}` };

    // Staff attempts to edit prices
    const editRes = await req(`/transactions/${invoiceId}`, {
      method: 'PATCH',
      headers: staffHeaders,
      body: JSON.stringify({
        passengers: [{ name: 'STAFF TARGET PAX', cost: 50, sell: 100 }]
      })
    });

    assert.equal(editRes.status, 403, `Expected 403 Forbidden for staff edit, got ${editRes.status}`);

    // Clean up
    await req(`/transactions/${invoiceId}`, { method: 'DELETE', headers: authHeaders });
  });

  // VULN-24: Pagination Limit Capping
  await check('VULN-24', 'Excessive limit queries (?limit=1000000) are capped to 100 max', async () => {
    const listRes = await req('/transactions?limit=1000000', { headers: authHeaders });
    assert.equal(listRes.status, 200, 'Transactions list returned 200');
    assert.equal(listRes.data.pagination.limit, 100, `Limit should be capped to 100, got ${listRes.data.pagination.limit}`);
  });

  // VULN-25: Multi-type array query
  await check('VULN-25', 'Multi-type array query (?type[]=TICKET_INVOICE&type[]=VISA_INVOICE) handled cleanly', async () => {
    const multiTypeRes = await req('/transactions?type[]=TICKET_INVOICE&type[]=VISA_INVOICE', { headers: authHeaders });
    assert.equal(multiTypeRes.status, 200, 'Handled array query without error');
    assert(Array.isArray(multiTypeRes.data.transactions), 'Returned transactions array');
  });

  console.log('\n================================================================');
  console.log(`🎉 NEW VULNERABILITY VERIFICATION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runNewVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
