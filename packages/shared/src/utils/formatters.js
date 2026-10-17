/**
 * Shared formatting helpers for currency, percentages, and employee initials.
 */

/**
 * Formats a numeric salary or budget amount as USD currency.
 * @param {number} value
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {string}
 */
export function formatCurrency(value, options = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Extracts up to 2 uppercase initials from a full name.
 * @param {string} [name]
 * @returns {string}
 */
export function getInitials(name = '') {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Formats a decimal ratio (e.g. 0.124) into a percentage string (e.g. "12.4%").
 * @param {number} ratio
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatPercentage(ratio, decimals = 1) {
  const safeValue = Number.isFinite(ratio) ? ratio * 100 : 0;
  return `${safeValue.toFixed(decimals)}%`;
}
