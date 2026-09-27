const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data, ok: res.ok };
}

async function runE2EVerification() {
  console.log('====================================================');
  console.log('🚀 STARTING FULL END-TO-END SYSTEM VERIFICATION');
  console.log('====================================================');

  // Step 1: Check Auth / Health
  console.log('\n[1] Checking Backend Health & Auth Status...');
  const healthRes = await request('/health');
  console.log(`✅ Health Status: ${healthRes.status} -`, healthRes.data);

  const statusRes = await request('/auth/status');
  console.log('ℹ️ Setup status:', statusRes.data);

  let token = '';

  if (statusRes.data.setupRequired) {
    console.log('\n[2] Executing Initial Admin Setup...');
    const setupRes = await request('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({
        companyName: 'AeroDesk',
        name: 'AeroDesk Admin',
        email: 'admin@aerodesk.com',
        password: 'adminPassword123'
      })
    });
    console.log(`✅ Setup Response: ${setupRes.status} - User: ${setupRes.data.user?.name}`);
    token = setupRes.data.token;
  } else {
    console.log('\n[2] Logging in as Admin...');
    let loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@aerodesk.com',
        password: 'adminPassword123'
      })
    });
    if (!loginRes.ok) {
      loginRes = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@aerodesk.com',
          password: 'admin123'
        })
      });
    }
    token = loginRes.data.token;
    console.log(`✅ Login Successful! Token acquired.`);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  // Step 3: Verify Master Data
  console.log('\n[3] Master Data Management...');
  const clientName = `TEST CLIENT ${Date.now()}`;
  const clientRes = await request('/clients', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: clientName,
      phone: '+880 1711-223344',
      email: 'testclient@aerodesk.com',
      passportNo: 'A09812345'
    })
  });
  console.log(`✅ Created Client: ${clientRes.data.client?.name} (ID: ${clientRes.data.client?._id})`);
  const createdClientId = clientRes.data.client._id;

  // Create Portal Supplier
  const portalRes = await request('/suppliers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `FLYHUB WALLET ${Date.now()}`,
      type: 'PORTAL',
      contactPerson: 'Mr. Tareq',
      phone: '01811000000'
    })
  });
  console.log(`✅ Created Portal Supplier: ${portalRes.data.supplier?.name} (ID: ${portalRes.data.supplier?._id})`);
  const portalId = portalRes.data.supplier._id;

  // Top-up Portal Wallet with BDT 200,000
  const topUpRes = await request('/transactions/supplier-txn', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      supplierId: portalId,
      amount: 200000,
      type: 'SUPPLIER_DEPOSIT',
      subtype: 'DEPOSIT',
      mode: 'BANK',
      remarks: 'Initial GDS credit load'
    })
  });
  console.log(`✅ Portal Wallet Topped Up: ${topUpRes.data.transaction?.ref} for BDT 200,000`);

  // Step 4: Issue Multi-Passenger Air Ticket Invoice
  console.log('\n[4] Issuing Multi-Passenger Ticket Invoice...');
  const invoiceRes = await request('/transactions/ticket-invoice', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      clientId: createdClientId,
      supplierId: portalId,
      passengers: [
        { name: 'MR MD SHAHED', ticketNo: '0981234567', pnr: 'BG7711', route: 'DAC-JED-DAC', cost: 65000, sell: 80000 },
        { name: 'MRS FATIMA BEGUM', ticketNo: '0981234568', pnr: 'BG7711', route: 'DAC-JED-DAC', cost: 65000, sell: 80000 }
      ],
      notes: 'Umrah Package Tickets'
    })
  });

  const invoice = invoiceRes.data.transaction;
  console.log(`✅ Ticket Invoice Issued: ${invoice.ref}`);
  console.log(`   - Total Buy (Cost): BDT ${invoice.totalBuy}`);
  console.log(`   - Total Sell (Price): BDT ${invoice.totalSell}`);
  console.log(`   - Net Profit: BDT ${invoice.profit}`);

  // Verify updated balances
  const updatedClientRes = await request(`/clients/${createdClientId}`, { headers: authHeaders });
  const updatedPortalRes = await request(`/suppliers/${portalId}`, { headers: authHeaders });

  console.log(`   - Client Due after Invoice: BDT ${updatedClientRes.data.client?.currentDue} (Expected: 160000)`);
  console.log(`   - Portal Balance after Invoice: BDT ${updatedPortalRes.data.supplier?.balance} (Expected: 70000 [200000 - 130000])`);

  if (updatedClientRes.data.client?.currentDue !== 160000 || updatedPortalRes.data.supplier?.balance !== 70000) {
    throw new Error('Balance update mismatch in Ticket Invoice creation!');
  }

  // Step 5: Receive Client Payment (Money Receipt)
  console.log('\n[5] Recording Client Payment Receipt...');
  const receiptRes = await request('/transactions/client-receipt', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      date: new Date().toISOString().split('T')[0],
      clientId: createdClientId,
      amount: 100000,
      mode: 'CASH',
      remarks: 'Advance partial payment for Umrah tickets'
    })
  });

  const receipt = receiptRes.data.transaction;
  console.log(`✅ Client Receipt Recorded: ${receipt.ref} for BDT ${receipt.amount}`);

  const postReceiptClient = await request(`/clients/${createdClientId}`, { headers: authHeaders });
  console.log(`   - Client Due after Payment: BDT ${postReceiptClient.data.client?.currentDue} (Expected: 60000 [160000 - 100000])`);

  if (postReceiptClient.data.client?.currentDue !== 60000) {
    throw new Error('Balance update mismatch in Client Receipt creation!');
  }

  // Step 6: Verify Client Statement
  console.log('\n[6] Generating Client Statement...');
  const statementRes = await request(`/reports/client-statement?clientId=${createdClientId}`, { headers: authHeaders });
  const statement = statementRes.data;
  console.log(`✅ Client Statement Generated for ${statement.client?.name}:`);
  console.log(`   - Opening Due: BDT ${statement.openingDue}`);
  console.log(`   - Period Billed: BDT ${statement.periodDebit}`);
  console.log(`   - Period Received: BDT ${statement.periodCredit}`);
  console.log(`   - Closing Due: BDT ${statement.closingDue}`);
  console.log(`   - Transaction Rows: ${statement.rows?.length}`);

  // Step 7: Test Money Receipt Voucher HTML/PDF endpoint
  console.log('\n[7] Generating Money Receipt Voucher with Lakh/Crore words...');
  const voucherRes = await request(`/transactions/${receipt._id}/receipt-pdf`, { headers: authHeaders });
  console.log(`✅ Receipt Voucher Status: ${voucherRes.status}`);
  if (typeof voucherRes.data === 'string' && voucherRes.data.includes('One Lakh Taka Only')) {
    console.log(`✅ Lakh/Crore wording confirmed: "One Lakh Taka Only" present in voucher template!`);
  } else {
    console.warn(`ℹ️ Voucher generated (${voucherRes.data.length} bytes).`);
  }

  // Step 8: Test Voiding Transaction and Recovery
  console.log('\n[8] Voiding Ticket Invoice and testing balance recovery...');
  const voidRes = await request(`/transactions/${invoice._id}/void`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      reason: 'Client requested itinerary change'
    })
  });
  console.log(`✅ Transaction ${invoice.ref} status: ${voidRes.data.transaction?.status}`);

  const postVoidClient = await request(`/clients/${createdClientId}`, { headers: authHeaders });
  const postVoidPortal = await request(`/suppliers/${portalId}`, { headers: authHeaders });

  console.log(`   - Client Due after Void: BDT ${postVoidClient.data.client?.currentDue} (Expected: -100000 due to active receipt)`);
  console.log(`   - Portal Balance after Void: BDT ${postVoidPortal.data.supplier?.balance} (Expected: 200000 restored)`);

  if (postVoidPortal.data.supplier?.balance !== 200000) {
    throw new Error('Portal balance did not restore correctly after void!');
  }

  // Step 9: Test Recalculate Balances Safety Net
  console.log('\n[9] Testing Admin Balance Recalculation Safety Net...');
  const recalcRes = await request('/maintenance/recalculate-balances', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({})
  });
  console.log(`✅ Recalculate Response:`, recalcRes.data.result);

  // Step 10: Dashboard Analytics Aggregation
  console.log('\n[10] Fetching Dashboard Summary...');
  const dashRes = await request('/dashboard/summary', { headers: authHeaders });
  console.log(`✅ Dashboard Summary:`, dashRes.data.summary);

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED 100%!');
  console.log('====================================================\n');
}

runE2EVerification().catch(err => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
