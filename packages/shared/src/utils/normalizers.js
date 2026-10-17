/**
 * Shared normalization and data sanitization utilities for EquiWage Analytics.
 */

/**
 * Normalizes spreadsheet column headers: removes accents/diacritics,
 * trims whitespace, converts to lowercase, and collapses internal spaces.
 * @param {string} key
 * @returns {string}
 */
export function normalizeHeaderKey(key = '') {
  return String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Parses a numeric value from spreadsheet strings (e.g., "$120,000.00", "88.400", 95000).
 * @param {unknown} rawValue
 * @returns {number}
 */
export function parseNumericValue(rawValue) {
  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue) ? rawValue : NaN;
  }
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return NaN;
  }
  const cleaned = String(rawValue).replace(/[^0-9.-]/g, '');
  if (!cleaned) return NaN;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Parses a job level from values like "L5", "Level 4", 3, etc.
 * @param {unknown} rawLevel
 * @returns {number}
 */
export function parseLevelValue(rawLevel) {
  if (typeof rawLevel === 'number') {
    return Number.isInteger(rawLevel) ? rawLevel : Math.round(rawLevel);
  }
  const match = String(rawLevel ?? '').match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

/**
 * Privacy Guard (RF-007): Verifies that an anonymized object contains no
 * personal employee identifiers ('name', 'fullName', 'employeeId', etc.)
 * before transmitting to an external LLM API.
 * @param {unknown} payload
 * @returns {boolean}
 */
export function hasNoPersonalIdentifiers(payload) {
  if (!payload || typeof payload !== 'object') return true;
  const forbiddenKeys = new Set(['name', 'fullname', 'employeename', 'employeeid', 'email', 'ssn']);
  const stack = [payload];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;
    for (const [key, value] of Object.entries(current)) {
      if (forbiddenKeys.has(key.toLowerCase())) {
        return false;
      }
      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }
  return true;
}
