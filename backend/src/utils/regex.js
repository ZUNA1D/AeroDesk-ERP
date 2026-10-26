/**
 * Safely escape regular expression special characters to prevent ReDoS and SyntaxErrors.
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
