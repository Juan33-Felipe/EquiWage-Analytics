import type { Employee, SalaryBand } from '../types/domain.types.js';

export declare const APP_NAME: 'EquiWage Analytics';
export declare const SESSION_SCHEMA_VERSION: 1;
export declare const DEPARTMENTS: readonly string[];
export declare const JOB_LEVELS: readonly number[];
export declare const INEQUITY_THRESHOLD: number;

export declare const SIMULATION_TARGETS: Readonly<{
  MINIMUM: 'minimum';
  MEDIAN: 'median';
}>;

export declare const BAND_STATUS: Readonly<{
  BELOW: 'below';
  ALIGNED: 'aligned';
  ABOVE: 'above';
  UNKNOWN: 'unknown';
}>;

export declare const GAP_SEVERITY: Readonly<{
  CRITICAL: 'critical';
  MODERATE: 'moderate';
  NONE: 'none';
}>;

export declare const ROLLOUT_QUARTERS_OPTIONS: readonly number[];
export declare const REPORT_SECTIONS: readonly string[];
export declare const REQUIRED_PAYROLL_COLUMNS: readonly string[];
export declare const REQUIRED_BAND_COLUMNS: readonly string[];

export declare const PAYROLL_COLUMN_ALIASES: Readonly<{
  id: readonly string[];
  name: readonly string[];
  role: readonly string[];
  department: readonly string[];
  level: readonly string[];
  currentSalary: readonly string[];
}>;

export declare const BAND_COLUMN_ALIASES: Readonly<{
  level: readonly string[];
  min: readonly string[];
  median: readonly string[];
  max: readonly string[];
}>;

export declare const DEFAULT_SALARY_BANDS: SalaryBand[];
export declare const DEFAULT_SEED_EMPLOYEES: Employee[];

export declare const DEFAULT_LOCAL_ADMIN_USER: Readonly<{
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  initials: string;
  defaultPassword: string;
}>;

export declare const API_ENDPOINTS: Readonly<{
  HEALTH: '/api/health';
  AUTH_LOGIN: '/api/auth/login';
  AUTH_REGISTER: '/api/auth/register';
  AUTH_VERIFY_CODE: '/api/auth/verify-code';
  AUTH_RESEND_CODE: '/api/auth/resend-code';
  AUTH_SESSION: '/api/auth/session';
  AUTH_LOGOUT: '/api/auth/logout';
  AUDIT_OVERVIEW: '/api/audit';
  EMPLOYEES: '/api/employees';
  BANDS: '/api/bands';
  SIMULATION: '/api/simulation';
  IMPORT_PAYROLL: '/api/import/payroll';
  IMPORT_BANDS: '/api/import/bands';
  SESSION_EXPORT: '/api/session/export';
  SESSION_RESTORE: '/api/session/restore';
  SESSION_RESET: '/api/session/reset';
  REPORTS_EXECUTIVE: '/api/reports/executive';
  AI_DIAGNOSTICS: '/api/ai/diagnostics';
}>;
