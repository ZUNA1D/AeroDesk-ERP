import { getApiUrl } from '../api/client.js';

/**
 * Open a printable document (PDF/HTML voucher or statement) in a new tab.
 * Handles URL resolution, browser popup blockers, and safe fallbacks.
 *
 * @param {string} endpoint - The API endpoint (e.g. '/transactions/123/receipt-pdf' or '/reports/client-statement?...')
 */
export function openPrintDocument(endpoint) {
  if (!endpoint) return;

  const fullUrl = getApiUrl(endpoint);

  // Try opening a new tab directly
  const printWindow = window.open(fullUrl, '_blank');

  // If browser popup blocker intervened (printWindow is null or blocked), fallback to anchor click
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
