import api, { getApiUrl } from '../api/client.js';

/**
 * Open a printable document (PDF/HTML voucher or statement) in a new tab.
 * Handles authenticated session fetching, browser popup blockers, and safe fallbacks.
 *
 * @param {string} endpoint - The API endpoint (e.g. '/transactions/123/receipt-pdf' or '/reports/client-statement?...')
 */
export async function openPrintDocument(endpoint) {
  if (!endpoint) return;

  try {
    const res = await api.get(endpoint, { responseType: 'text' });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(res.data);
      printWindow.document.close();
      return;
    }
  } catch (_) {
    // Fallback to direct navigation if inline window write fails
  }

  const fullUrl = getApiUrl(endpoint);
  const printWindow = window.open(fullUrl, '_blank');
  if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_blank';
    link.rel = 'noopener,noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
