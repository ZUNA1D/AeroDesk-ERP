import { Settings } from '../models/Settings.js';
import { formatMoney } from '../utils/money.js';
import { numberToWords } from '../utils/numberToWords.js';

async function getCompanySettings(agencyId = null) {
  let settings = null;
  if (agencyId) {
    settings = await Settings.findOne({ agency: agencyId });
  }
  if (!settings) {
    settings = await Settings.findOne();
  }
  if (!settings) {
    settings = {
      companyName: 'AeroDesk',
      tagline: 'Travel & Aviation Agency ERP',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1700-000000',
      email: 'admin@aerodesk.com',
      currency: 'BDT',
      logoUrl: ''
    };
  }
  return settings;
}

/**
 * Generate Money Receipt Voucher HTML
 */
export async function renderMoneyReceiptHtml(receipt, client, agencyId = null) {
  const settings = await getCompanySettings(agencyId || receipt.agency);
  const amount = Number(receipt.amount ?? receipt.totalSell ?? 0);
  const words = numberToWords(amount);
  const formattedAmount = formatMoney(amount);


  const logoMarkup = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 60px; max-width: 180px; object-fit: contain;" />`
    : `<div style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${settings.companyName.toUpperCase()}</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Money Receipt - ${receipt.ref}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      font-size: 14px;
      line-height: 1.5;
    }
    .voucher-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
    }
    .company-details {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .voucher-title-wrap {
      text-align: center;
      margin: 20px 0;
    }
    .voucher-title {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      padding: 6px 20px;
      border-radius: 20px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .meta-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .meta-grid td {
      padding: 6px 10px;
    }
    .meta-label {
      font-weight: 600;
      color: #64748b;
      width: 15%;
    }
    .meta-value {
      font-weight: 600;
      color: #0f172a;
      border-bottom: 1px dashed #cbd5e1;
    }
    .amount-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 24px 0;
    }
    .amount-in-words {
      font-style: italic;
      color: #334155;
      font-size: 14px;
      margin-top: 6px;
      font-weight: 500;
    }
    .amount-num {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .signatures {
      width: 100%;
      margin-top: 60px;
      border-collapse: collapse;
    }
    .signatures td {
      width: 50%;
      padding-top: 40px;
      text-align: center;
      vertical-align: bottom;
    }
    .sig-line {
      border-top: 1px solid #475569;
      width: 70%;
      margin: 0 auto 6px auto;
    }
    .sig-text {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .voucher-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px;">
    <button onclick="window.print()" style="background: #0ea5e9; color: #fff; border: none; padding: 8px 24px; font-weight: 600; border-radius: 6px; cursor: pointer;">Print Receipt</button>
  </div>

  <div class="voucher-card">
    <table class="header-table">
      <tr>
        <td style="vertical-align: middle;">
          ${logoMarkup}
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">${settings.tagline || ''}</div>
        </td>
        <td class="company-details" style="vertical-align: middle;">
          <div><strong>${settings.companyName}</strong></div>
          <div>${settings.address || ''}</div>
          <div>Phone: ${settings.phone || ''}</div>
          <div>Email: ${settings.email || ''}</div>
        </td>
      </tr>
    </table>

    <div class="voucher-title-wrap">
      <div class="voucher-title">Money Receipt</div>
    </div>

    <table class="meta-grid">
      <tr>
        <td class="meta-label">Receipt No:</td>
        <td class="meta-value" style="width: 35%;"><strong>${receipt.ref}</strong></td>
        <td class="meta-label">Date:</td>
        <td class="meta-value">${new Date(receipt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
      </tr>
      <tr>
        <td class="meta-label">Received From:</td>
        <td class="meta-value" colspan="3"><strong>${(client?.name || receipt.clientName || 'VALUED CLIENT').toUpperCase()}</strong></td>
      </tr>
      <tr>
        <td class="meta-label">Payment Mode:</td>
        <td class="meta-value">${receipt.mode || 'CASH'} ${receipt.bankName ? `(${receipt.bankName})` : ''}</td>
        <td class="meta-label">Ref / Cheque:</td>
        <td class="meta-value">${receipt.chequeNo || receipt.transactionId || 'N/A'}</td>
      </tr>
      <tr>
        <td class="meta-label">Particulars:</td>
        <td class="meta-value" colspan="3">${receipt.remarks || 'Payment on account'}</td>
      </tr>
    </table>

    <div class="amount-box">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount Received:</span>
        <span class="amount-num">${settings.currency} ${formattedAmount}</span>
      </div>
      <div class="amount-in-words">
        <strong>In Words:</strong> ${words}
      </div>
    </div>

    <table class="signatures">
      <tr>
        <td>
          <div class="sig-line"></div>
          <div class="sig-text">Customer Signature</div>
        </td>
        <td>
          <div class="sig-line"></div>
          <div class="sig-text">Authorized Signature & Seal</div>
        </td>
      </tr>
    </table>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>
`;
}

/**
 * Generate Client / Supplier Statement HTML
 */
export async function renderStatementHtml({ title, partyName, partyDetails, period, openingBalance, closingBalance, rows, currency = 'BDT' }) {
  const settings = await getCompanySettings();

  const logoMarkup = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="Logo" style="max-height: 50px; object-fit: contain;" />`
    : `<div style="font-size: 20px; font-weight: 800; color: #0f172a;">${settings.companyName.toUpperCase()}</div>`;

  const rowsMarkup = rows.map(r => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 10px; font-size: 12px;">${new Date(r.date).toLocaleDateString('en-GB')}</td>
      <td style="padding: 8px 10px; font-size: 12px; font-weight: 600;">${r.ref}</td>
      <td style="padding: 8px 10px; font-size: 12px;">${r.description || r.type}</td>
      <td style="padding: 8px 10px; font-size: 12px; text-align: right; color: #0f172a;">${r.debit || r.cost ? formatMoney(r.debit || r.cost) : '-'}</td>
      <td style="padding: 8px 10px; font-size: 12px; text-align: right; color: #16a34a;">${r.credit || r.depositOrPayment ? formatMoney(r.credit || r.depositOrPayment) : '-'}</td>
      <td style="padding: 8px 10px; font-size: 12px; text-align: right; font-weight: 700;">${formatMoney(r.balance)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} - ${partyName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #0f172a;
      padding: 20px;
      background: #f8fafc;
    }
    .report-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
      max-width: 900px;
      margin: 0 auto;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    table.data-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 10px;
      text-align: left;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .report-card { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px;">
    <button onclick="window.print()" style="background: #0ea5e9; color: #fff; border: none; padding: 8px 24px; font-weight: 600; border-radius: 6px; cursor: pointer;">Print Statement</button>
  </div>

  <div class="report-card">
    <table style="width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
      <tr>
        <td>
          ${logoMarkup}
          <div style="font-size: 12px; color: #64748b;">${settings.address || ''} | Phone: ${settings.phone || ''}</div>
        </td>
        <td style="text-align: right;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${title}</h2>
          <div style="font-size: 12px; color: #64748b;">Period: ${period.from || 'All time'} to ${period.to || 'Present'}</div>
        </td>
      </tr>
    </table>

    <table style="width: 100%; margin-bottom: 16px; font-size: 13px;">
      <tr>
        <td>
          <strong>Statement For:</strong> <span style="font-size: 15px; font-weight: 700;">${partyName}</span><br />
          <span style="color: #64748b;">${partyDetails || ''}</span>
        </td>
        <td style="text-align: right;">
          <div>Opening Balance: <strong>${currency} ${formatMoney(openingBalance)}</strong></div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px;">
            Closing Balance: ${currency} ${formatMoney(closingBalance)}
          </div>
        </td>
      </tr>
    </table>

    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Ref</th>
          <th>Description</th>
          <th style="text-align: right;">Debit (${currency})</th>
          <th style="text-align: right;">Credit (${currency})</th>
          <th style="text-align: right;">Balance (${currency})</th>
        </tr>
      </thead>
      <tbody>
        ${rowsMarkup}
      </tbody>
    </table>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>
  `;
}
