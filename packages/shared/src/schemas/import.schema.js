import {
  BAND_COLUMN_ALIASES,
  PAYROLL_COLUMN_ALIASES,
} from '../constants/compensation.constants.js';
import {
  normalizeHeaderKey,
  parseLevelValue,
  parseNumericValue,
} from '../utils/normalizers.js';

/**
 * Human-readable labels for mandatory payroll columns (RF-001, RNF-003).
 */
const PAYROLL_FIELD_LABELS = Object.freeze({
  id: 'ID',
  name: 'Nombre / Full Name',
  role: 'Cargo / Job Title',
  department: 'Departamento / Department',
  level: 'Nivel / Job Level',
  currentSalary: 'Salario Actual / Current Salary',
});

/**
 * Human-readable labels for mandatory salary band columns (RF-002, RNF-003).
 */
const BAND_FIELD_LABELS = Object.freeze({
  level: 'Nivel / Job Level',
  min: 'Minimo P25 / Min Salary',
  median: 'Mediana P50 / Market Median',
  max: 'Maximo P75 / Max Salary',
});

/**
 * Resolves a canonical field value from a normalized row lookup map.
 * @param {Record<string, unknown>} lookup
 * @param {readonly string[]} aliases
 * @returns {unknown}
 */
function pickAliasValue(lookup, aliases) {
  for (const alias of aliases) {
    const normalized = normalizeHeaderKey(alias);
    if (lookup[normalized] !== undefined && lookup[normalized] !== '') {
      return lookup[normalized];
    }
  }
  return undefined;
}

/**
 * Inspects the headers of raw spreadsheet rows and returns any missing mandatory
 * payroll columns in clear, user-friendly HR language (RNF-003).
 *
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ strictDepartment?: boolean }} [options]
 * @returns {string[]}
 */
export function findMissingPayrollColumns(rows, options = {}) {
  const { strictDepartment = false } = options;
  const requiredFields = strictDepartment
    ? ['id', 'name', 'role', 'department', 'level', 'currentSalary']
    : ['id', 'name', 'role', 'level', 'currentSalary'];

  if (!Array.isArray(rows) || rows.length === 0) {
    return requiredFields.map((field) => PAYROLL_FIELD_LABELS[field]);
  }

  const presentHeaders = new Set(Object.keys(rows[0] || {}).map(normalizeHeaderKey));

  return requiredFields
    .filter((field) => {
      const aliases = PAYROLL_COLUMN_ALIASES[field] || [];
      return !aliases.some((alias) => presentHeaders.has(normalizeHeaderKey(alias)));
    })
    .map((field) => PAYROLL_FIELD_LABELS[field]);
}

/**
 * Inspects the headers of raw spreadsheet rows and returns any missing mandatory
 * salary band columns in clear, user-friendly HR language (RNF-003).
 *
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string[]}
 */
export function findMissingBandColumns(rows) {
  const requiredFields = ['level', 'min', 'median', 'max'];

  if (!Array.isArray(rows) || rows.length === 0) {
    return requiredFields.map((field) => BAND_FIELD_LABELS[field]);
  }

  const presentHeaders = new Set(Object.keys(rows[0] || {}).map(normalizeHeaderKey));

  return requiredFields
    .filter((field) => {
      const aliases = BAND_COLUMN_ALIASES[field] || [];
      return !aliases.some((alias) => presentHeaders.has(normalizeHeaderKey(alias)));
    })
    .map((field) => BAND_FIELD_LABELS[field]);
}

/**
 * Validates and normalizes raw spreadsheet rows into clean Employee objects (RF-001, RNF-003).
 *
 * @param {Array<Record<string, unknown>>} rawRows
 * @param {{ strictDepartment?: boolean }} [options]
 * @returns {import('../types/api.types.js').ImportValidationResult<import('../types/domain.types.js').Employee>}
 */
export function validateAndNormalizePayrollRows(rawRows, options = {}) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      ok: false,
      errorKey: 'error.emptyFile',
      message: 'The uploaded file is empty or contains no readable employee rows.',
    };
  }

  const missingColumns = findMissingPayrollColumns(rawRows, options);
  if (missingColumns.length > 0) {
    return {
      ok: false,
      missingColumns,
      errorKey: 'employees.missingRequired',
      message: `The file is missing mandatory columns required for the audit: ${missingColumns.join(', ')}.`,
    };
  }

  const employees = [];
  const invalidRows = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +2 accounts for 1-based indexing and header row
    const lookup = {};
    Object.entries(rawRow || {}).forEach(([key, value]) => {
      lookup[normalizeHeaderKey(key)] = value;
    });

    const rawId = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.id);
    const rawName = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.name);
    const rawRole = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.role);
    const rawDepartment = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.department);
    const rawLevel = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.level);
    const rawSalary = pickAliasValue(lookup, PAYROLL_COLUMN_ALIASES.currentSalary);

    const level = parseLevelValue(rawLevel);
    const currentSalary = parseNumericValue(rawSalary);

    if (!Number.isFinite(currentSalary) || currentSalary <= 0) {
      invalidRows.push({
        rowNumber,
        reason: 'Current salary must be a positive number.',
      });
      return;
    }

    if (!Number.isFinite(level) || level < 1 || level > 20) {
      invalidRows.push({
        rowNumber,
        reason: 'Job level must be a valid level number (e.g., 1 to 8).',
      });
      return;
    }

    employees.push({
      id: String(rawId || `EMP-${String(index + 1).padStart(3, '0')}`).trim(),
      name: String(rawName || 'Unnamed Employee').trim(),
      role: String(rawRole || 'Unassigned Role').trim(),
      department: String(rawDepartment || 'Unassigned').trim(),
      level,
      currentSalary,
    });
  });

  if (employees.length === 0) {
    return {
      ok: false,
      invalidRows,
      errorKey: 'error.noValidEmployees',
      message:
        'None of the rows in the file had valid numeric salaries and job levels. Please verify your spreadsheet values.',
    };
  }

  return {
    ok: true,
    data: employees,
    rowCount: employees.length,
    invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
  };
}

/**
 * Validates and normalizes raw spreadsheet rows into sorted SalaryBand objects (RF-002, RNF-003).
 *
 * @param {Array<Record<string, unknown>>} rawRows
 * @returns {import('../types/api.types.js').ImportValidationResult<import('../types/domain.types.js').SalaryBand>}
 */
export function validateAndNormalizeBandRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      ok: false,
      errorKey: 'error.emptyFile',
      message: 'The uploaded file is empty or contains no readable salary band rows.',
    };
  }

  const missingColumns = findMissingBandColumns(rawRows);
  if (missingColumns.length > 0) {
    return {
      ok: false,
      missingColumns,
      errorKey: 'error.noRanges',
      message: `The salary band file is missing required columns: ${missingColumns.join(', ')}.`,
    };
  }

  const bands = [];
  const invalidRows = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;
    const lookup = {};
    Object.entries(rawRow || {}).forEach(([key, value]) => {
      lookup[normalizeHeaderKey(key)] = value;
    });

    const level = parseLevelValue(pickAliasValue(lookup, BAND_COLUMN_ALIASES.level));
    const min = parseNumericValue(pickAliasValue(lookup, BAND_COLUMN_ALIASES.min));
    const median = parseNumericValue(pickAliasValue(lookup, BAND_COLUMN_ALIASES.median));
    const max = parseNumericValue(pickAliasValue(lookup, BAND_COLUMN_ALIASES.max));

    if (![level, min, median, max].every(Number.isFinite) || min <= 0) {
      invalidRows.push({
        rowNumber,
        reason: 'Level, Minimum (P25), Median (P50), and Maximum (P75) must all be positive numbers.',
      });
      return;
    }

    if (min > median || median > max) {
      invalidRows.push({
        rowNumber,
        reason: `Band range for Level ${level} is inverted: Minimum (P25) must be <= Median (P50) <= Maximum (P75).`,
      });
      return;
    }

    bands.push({
      level,
      min,
      median,
      max,
    });
  });

  if (bands.length === 0) {
    return {
      ok: false,
      invalidRows,
      errorKey: 'error.noRanges',
      message: 'We could not find valid salary ranges (P25, P50, P75) in this file.',
    };
  }

  bands.sort((a, b) => a.level - b.level);

  return {
    ok: true,
    data: bands,
    rowCount: bands.length,
    invalidRows: invalidRows.length > 0 ? invalidRows : undefined,
  };
}
