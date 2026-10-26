
const BASE_URL = 'http://localhost:5000/api';

async function testProbes() {
  console.log('=== RUNNING COMPREHENSIVE PROBE FOR NEW VULNERABILITIES & EDGE CASES ===\n');

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aerodesk.com', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('✅ Authenticated as Agency Admin.');

  // PROBE 1: NEW VULN-15 & VULN-16: Refunding a voided invoice & Negative/Excessive refund amounts
  console.log('\n--- PROBE 1: Refund Edge Cases & Vulnerabilities ---');
  // First, create a fresh ticket invoice
  const invRes = await fetch(`${BASE_URL}/transactions/ticket-invoice`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'TEST REFUND CLIENT',
      supplierId: (await (await fetch(`${BASE_URL}/suppliers`, { headers: authHeaders })).json()).suppliers[0]._id,
      passengers: [{ name: 'TEST PAX', cost: 500, sell: 1000 }]
    })
  });
  const invData = await invRes.json();
  const invoiceId = invData.transaction._id;
  console.log(`Created ticket invoice ${invData.transaction.ref} (Sell: 1000, Cost: 500)`);

  // Try creating a negative refund
  const negRefundRes = await fetch(`${BASE_URL}/transactions/refund`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      parentTransactionId: invoiceId,
      clientRefundAmount: -500,
      supplierRefundAmount: -200,
      reason: 'Negative test'
    })
  });
  console.log(`[PROBE] Negative refund response status: ${negRefundRes.status} (Expected 400 rejection)`);

  // Try creating an excessive refund (> totalSell)
  const excessRefundRes = await fetch(`${BASE_URL}/transactions/refund`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      parentTransactionId: invoiceId,
      clientRefundAmount: 999999,
      supplierRefundAmount: 500,
      reason: 'Excessive refund test'
    })
  });
  console.log(`[PROBE] Excessive refund (> 1000) response status: ${excessRefundRes.status} (Expected 400 rejection)`);

  // Void the ticket invoice
  const voidRes = await fetch(`${BASE_URL}/transactions/${invoiceId}/void`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Voiding for refund test' })
  });
  console.log(`Voided invoice status: ${voidRes.status}`);

  // Now try to refund the VOIDED invoice!
  const voidRefundRes = await fetch(`${BASE_URL}/transactions/refund`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      parentTransactionId: invoiceId,
      clientRefundAmount: 500,
      supplierRefundAmount: 300,
      reason: 'Refunding a voided invoice test'
    })
  });
  console.log(`[PROBE] Refunding VOIDED invoice status: ${voidRefundRes.status} (Expected 400 rejection)`);

  // PROBE 2: NEW VULN-17: Airline and Sector filters on Profit Reports
  console.log('\n--- PROBE 2: Profit Report Filters (airlineId / sectorId) ---');
  const airlinesRes = await fetch(`${BASE_URL}/airlines`, { headers: authHeaders });
  const airlines = (await airlinesRes.json()).airlines;
  if (airlines && airlines.length > 0) {
    const fakeAirlineId = airlines[0]._id;
    const reportRes = await fetch(`${BASE_URL}/reports/profit-ticket?airlineId=${fakeAirlineId}`, {
      headers: authHeaders
    });
    const reportData = await reportRes.json();
    console.log(`[PROBE] Ticket profit report rows returned for airlineId ${fakeAirlineId}: ${reportData.rows?.length}`);
  }

  // PROBE 3: NEW VULN-18: Bcrypt thread starvation on long password
  console.log('\n--- PROBE 3: Long Password (>128 chars) Bcrypt Exhaustion ---');
  const giantPassword = 'A'.repeat(5000);
  const longPassRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aerodesk.com', password: giantPassword })
  });
  console.log(`[PROBE] Login with 5000-char password response status: ${longPassRes.status} (Expected 400)`);

  // PROBE 4: NEW VULN-19: updateUser ReferenceError (before is not defined)
  console.log('\n--- PROBE 4: User Update ReferenceError Check ---');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  const updateRes = await fetch(`${BASE_URL}/users/${meData.user.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Agency Administrator Updated' })
  });
  console.log(`[PROBE] Update user response status: ${updateRes.status} (500 means ReferenceError!)`);
  if (updateRes.status === 500) {
    const errText = await updateRes.text();
    console.log(`[PROBE] 500 Error output: ${errText}`);
  }

  // PROBE 5: NEW VULN-20: Expense creation with fake foreign categoryId
  console.log('\n--- PROBE 5: Expense with non-existent / foreign categoryId ---');
  const fakeCatId = '507f1f77bcf86cd799439011';
  const expRes = await fetch(`${BASE_URL}/transactions/expense`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      amount: 1500,
      categoryId: fakeCatId,
      remarks: 'Test foreign category'
    })
  });
  console.log(`[PROBE] Expense with non-existent category status: ${expRes.status} (Expected 400 rejection)`);

  // PROBE 6: NEW VULN-22: Supplier deposit on DIRECT / isSelf supplier
  console.log('\n--- PROBE 6: Supplier Deposit on DIRECT / In-House Supplier ---');
  const suppliersRes = await fetch(`${BASE_URL}/suppliers`, { headers: authHeaders });
  const suppliers = (await suppliersRes.json()).suppliers;
  const selfSupplier = suppliers.find(s => s.isSelf || s.type === 'DIRECT');
  if (selfSupplier) {
    const depRes = await fetch(`${BASE_URL}/transactions/supplier-txn`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        supplierId: selfSupplier._id,
        amount: 5000,
        type: 'SUPPLIER_DEPOSIT'
      })
    });
    console.log(`[PROBE] Deposit on DIRECT supplier status: ${depRes.status} (Expected 400 rejection)`);
  }

  // PROBE 7: NEW VULN-24: STAFF role editing financial transactions
  console.log('\n--- PROBE 7: Staff Role modifying financial transaction ---');
  // Create a staff user if not exists
  const usersRes = await fetch(`${BASE_URL}/users`, { headers: authHeaders });
  const users = (await usersRes.json()).users;
  let staffUser = users.find(u => u.role === 'STAFF');
  if (!staffUser) {
    const createStaffRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Staff Member',
        email: 'staff_probe@aerodesk.com',
        password: 'Password123!',
        role: 'STAFF'
      })
    });
    staffUser = (await createStaffRes.json()).user;
  }

  const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff_probe@aerodesk.com', password: 'Password123!' })
  });
  const staffLoginData = await staffLoginRes.json();
  const staffToken = staffLoginData.token;
  const staffHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${staffToken}`
  };

  // Create an active invoice as admin
  const inv2Res = await fetch(`${BASE_URL}/transactions/ticket-invoice`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      clientName: 'STAFF EDIT TEST CLIENT',
      supplierId: suppliers[0]._id,
      passengers: [{ name: 'STAFF TEST PAX', cost: 500, sell: 1000 }]
    })
  });
  const inv2Data = await inv2Res.json();
  const inv2Id = inv2Data.transaction._id;

  // Now staff attempts to PATCH the invoice amounts to change sell price!
  const staffEditRes = await fetch(`${BASE_URL}/transactions/${inv2Id}`, {
    method: 'PATCH',
    headers: staffHeaders,
    body: JSON.stringify({
      passengers: [{ name: 'STAFF TEST PAX', cost: 100, sell: 200 }]
    })
  });
  console.log(`[PROBE] Staff editing transaction status: ${staffEditRes.status} (Expected 403 Forbidden!)`);

  console.log('\n=== PROBE COMPLETE ===');
}

testProbes().catch(console.error);
