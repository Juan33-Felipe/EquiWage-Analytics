import {
  APP_NAME,
  DEPARTMENTS,
  SESSION_SCHEMA_VERSION,
  SIMULATION_TARGETS,
} from '../constants/compensation.constants.js';

/**
 * Validates a local project session JSON object before restoring state (RF-008).
 *
 * @param {unknown} payload
 * @returns {{ ok: true, session: import('../types/domain.types.js').ProjectSessionPayload } | { ok: false, errorKey: string, message: string }}
 */
export function validateSessionPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      errorKey: 'settings.invalidSession',
      message: 'The selected file is not a valid JSON project session.',
    };
  }

  const candidate = /** @type {Record<string, unknown>} */ (payload);

  if (!Array.isArray(candidate.employees) || candidate.employees.length === 0) {
    return {
      ok: false,
      errorKey: 'settings.invalidSession',
      message: 'The session file does not contain a valid employee payroll list.',
    };
  }

  if (!Array.isArray(candidate.bands) || candidate.bands.length === 0) {
    return {
      ok: false,
      errorKey: 'settings.invalidSession',
      message: 'The session file does not contain valid market salary bands.',
    };
  }

  const normalizedEmployees = candidate.employees
    .map((emp, idx) => ({
      id: String(emp?.id || `EMP-${idx + 1}`),
      name: String(emp?.name || 'Unnamed Employee'),
      role: String(emp?.role || 'Unassigned Role'),
      department: String(emp?.department || 'Unassigned'),
      level: Number(emp?.level) || 1,
      currentSalary: Number(emp?.currentSalary) || 0,
    }))
    .filter((emp) => emp.currentSalary > 0);

  const normalizedBands = candidate.bands
    .map((band) => ({
      level: Number(band?.level),
      min: Number(band?.min),
      median: Number(band?.median),
      max: Number(band?.max),
    }))
    .filter((band) => [band.level, band.min, band.median, band.max].every(Number.isFinite))
    .sort((a, b) => a.level - b.level);

  if (normalizedEmployees.length === 0 || normalizedBands.length === 0) {
    return {
      ok: false,
      errorKey: 'settings.invalidSession',
      message: 'The session file contains corrupted employee or salary band entries.',
    };
  }

  const rawSim = /** @type {Record<string, unknown> | undefined} */ (candidate.simulation);
  const simulation = {
    target:
      rawSim?.target === SIMULATION_TARGETS.MEDIAN
        ? SIMULATION_TARGETS.MEDIAN
        : SIMULATION_TARGETS.MINIMUM,
    rolloutQuarters: Math.min(Math.max(Number(rawSim?.rolloutQuarters) || 1, 1), 4),
    departments: Array.isArray(rawSim?.departments)
      ? rawSim.departments.map(String)
      : [...DEPARTMENTS],
  };

  return {
    ok: true,
    session: {
      app: String(candidate.app || APP_NAME),
      version: Number(candidate.version) || SESSION_SCHEMA_VERSION,
      savedAt: String(candidate.savedAt || new Date().toISOString()),
      payrollSource: String(candidate.payrollSource || 'Restored session'),
      employees: normalizedEmployees,
      bands: normalizedBands,
      simulation,
    },
  };
}
