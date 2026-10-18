/**
 * Shared compensation domain constants, thresholds, column definitions,
 * seed datasets, and API endpoint routes for EquiWage Analytics.
 */

export const APP_NAME = 'EquiWage Analytics';
export const SESSION_SCHEMA_VERSION = 1;

/** Standard enterprise departments in EquiWage Analytics. */
export const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance'];

/** Supported corporate job levels (L1 through L8). */
export const JOB_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Internal inequity threshold defined by HR policy (RF-004):
 * salary difference > 10% (0.10) within the same role and level.
 */
export const INEQUITY_THRESHOLD = 0.1;

/** Target policies for the real-time leveling budget simulator (RF-005). */
export const SIMULATION_TARGETS = Object.freeze({
  MINIMUM: 'minimum',
  MEDIAN: 'median',
});

/** Employee alignment status relative to their job level's market salary band. */
export const BAND_STATUS = Object.freeze({
  BELOW: 'below',
  ALIGNED: 'aligned',
  ABOVE: 'above',
  UNKNOWN: 'unknown',
});

/** Severity classifications for salary gaps and internal inequities. */
export const GAP_SEVERITY = Object.freeze({
  CRITICAL: 'critical',
  MODERATE: 'moderate',
  NONE: 'none',
});

/** Allowed quarterly phased rollout options (RF-005). */
export const ROLLOUT_QUARTERS_OPTIONS = [1, 2, 3, 4];

/** Available sections for executive PDF & Excel reports (RF-007). */
export const REPORT_SECTIONS = [
  'Executive Cost Summary',
  'Statistical Disparity Analysis',
  'Identified Outlier List',
  'Band Compression Metrics',
];

/**
 * Mandatory columns for payroll CSV/XLSX import (RF-001, RNF-003).
 * Displayed in user-friendly HR terminology when reporting missing columns.
 */
export const REQUIRED_PAYROLL_COLUMNS = [
  'ID',
  'Nombre',
  'Cargo',
  'Departamento',
  'Nivel',
  'Salario Actual',
];

/**
 * Mandatory columns for salary bands CSV/XLSX import (RF-002, RNF-003).
 */
export const REQUIRED_BAND_COLUMNS = [
  'Nivel',
  'Minimo P25',
  'Mediana P50',
  'Maximo P75',
];

/**
 * Flexible normalized header aliases (Spanish & English) mapped to canonical employee fields.
 */
export const PAYROLL_COLUMN_ALIASES = Object.freeze({
  id: ['id', 'employee id', 'emp id', 'codigo', 'identificacion', 'id empleado'],
  name: ['nombre', 'name', 'full name', 'nombre completo', 'empleado', 'employee', 'employee name'],
  role: ['cargo', 'role', 'job title', 'title', 'puesto', 'posicion', 'position'],
  department: ['departamento', 'department', 'dept', 'area', 'unidad'],
  level: ['nivel', 'level', 'job level', 'nivel de cargo', 'grade', 'banda'],
  currentSalary: [
    'salario actual',
    'current salary',
    'salary',
    'salario',
    'sueldo',
    'sueldo actual',
    'base salary',
    'comp',
    'compensacion',
  ],
});

/**
 * Flexible normalized header aliases (Spanish & English) mapped to canonical salary band fields.
 */
export const BAND_COLUMN_ALIASES = Object.freeze({
  level: ['nivel', 'level', 'job level', 'nivel de cargo', 'grade'],
  min: ['minimo p25', 'min', 'p25', 'minimo', 'minimum', 'min salary', 'salario minimo', 'band min'],
  median: ['mediana p50', 'median', 'p50', 'mediana', 'market median', 'salario medio', 'midpoint'],
  max: ['maximo p75', 'max', 'p75', 'maximo', 'maximum', 'max salary', 'salario maximo', 'band max'],
});

/**
 * Default market salary bands (Job Levels L1 to L8 with P25 minimum, P50 median, P75 maximum).
 */
export const DEFAULT_SALARY_BANDS = [
  { level: 1, min: 45000, median: 55000, max: 65000 },
  { level: 2, min: 58000, median: 70000, max: 82000 },
  { level: 3, min: 72000, median: 86000, max: 100000 },
  { level: 4, min: 88000, median: 104000, max: 122000 },
  { level: 5, min: 108000, median: 126000, max: 148000 },
  { level: 6, min: 132000, median: 154000, max: 180000 },
  { level: 7, min: 160000, median: 184000, max: 214000 },
  { level: 8, min: 190000, median: 220000, max: 260000 },
];

/**
 * Default realistic employee payroll seed dataset containing market gaps (< P25)
 * and internal role/level inequities (> 10% spread).
 */
export const DEFAULT_SEED_EMPLOYEES = [
  { id: 'EMP-001', name: 'Maya Chen', role: 'Senior Product Designer', department: 'Product', level: 5, currentSalary: 103000 },
  { id: 'EMP-002', name: 'Daniel Brooks', role: 'Software Engineer II', department: 'Engineering', level: 4, currentSalary: 88400 },
  { id: 'EMP-003', name: 'Priya Nair', role: 'Marketing Manager', department: 'Marketing', level: 5, currentSalary: 110000 },
  { id: 'EMP-004', name: 'Jordan Ellis', role: 'Financial Analyst', department: 'Finance', level: 3, currentSalary: 77400 },
  { id: 'EMP-005', name: 'Sofia Martinez', role: 'People Operations Lead', department: 'HR', level: 5, currentSalary: 113600 },
  { id: 'EMP-006', name: 'Liam O’Connor', role: 'Staff Engineer', department: 'Engineering', level: 6, currentSalary: 149000 },
  { id: 'EMP-007', name: 'Aisha Rahman', role: 'Account Executive', department: 'Sales', level: 3, currentSalary: 69000 },
  { id: 'EMP-008', name: 'Noah Kim', role: 'Product Manager', department: 'Product', level: 5, currentSalary: 128000 },
  { id: 'EMP-009', name: 'Emma Wilson', role: 'Recruiter', department: 'HR', level: 2, currentSalary: 61500 },
  { id: 'EMP-010', name: 'Lucas Hayes', role: 'Software Engineer II', department: 'Engineering', level: 4, currentSalary: 97000 },
  { id: 'EMP-011', name: 'Olivia Braun', role: 'Senior Software Engineer', department: 'Engineering', level: 5, currentSalary: 121000 },
  { id: 'EMP-012', name: 'Ethan Cole', role: 'Sales Manager', department: 'Sales', level: 6, currentSalary: 138000 },
  { id: 'EMP-013', name: 'Chloe Adeyemi', role: 'Brand Designer', department: 'Marketing', level: 3, currentSalary: 81000 },
  { id: 'EMP-014', name: 'Mateo Silva', role: 'Engineering Manager', department: 'Engineering', level: 7, currentSalary: 168000 },
  { id: 'EMP-015', name: 'Hannah Petrov', role: 'Financial Controller', department: 'Finance', level: 6, currentSalary: 151000 },
  { id: 'EMP-016', name: 'Ryan Foster', role: 'Support Specialist', department: 'Sales', level: 1, currentSalary: 41000 },
  { id: 'EMP-017', name: 'Isabella Rossi', role: 'VP of Product', department: 'Product', level: 8, currentSalary: 205000 },
  { id: 'EMP-018', name: 'Kwame Mensah', role: 'Staff Engineer', department: 'Engineering', level: 6, currentSalary: 160000 },
  { id: 'EMP-019', name: 'Grace Lindqvist', role: 'Head of People', department: 'HR', level: 7, currentSalary: 171000 },
  { id: 'EMP-020', name: 'Diego Herrera', role: 'Account Executive', department: 'Sales', level: 3, currentSalary: 75500 },
  { id: 'EMP-021', name: 'Amara Okafor', role: 'Data Analyst', department: 'Finance', level: 4, currentSalary: 92000 },
  { id: 'EMP-022', name: 'Felix Andersen', role: 'Product Analyst', department: 'Product', level: 3, currentSalary: 88000 },
  { id: 'EMP-023', name: 'Nadia Hassan', role: 'Content Strategist', department: 'Marketing', level: 4, currentSalary: 99500 },
  { id: 'EMP-024', name: 'Owen Bennett', role: 'Support Specialist', department: 'Sales', level: 1, currentSalary: 47500 },
];

/**
 * Default local HR analyst/admin account seeded into SQLite on initial launch.
 */
export const DEFAULT_LOCAL_ADMIN_USER = Object.freeze({
  id: 'USR-ADMIN-001',
  username: 'hr.admin',
  email: 'admin@equiwage.local',
  fullName: 'Elena Vance',
  role: 'Lead Compensation Analyst',
  department: 'HR',
  initials: 'EV',
  defaultPassword: 'EquiWage2026!',
});

/** Canonical REST API endpoint paths shared between frontend and backend. */
export const API_ENDPOINTS = Object.freeze({
  HEALTH: '/api/health',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_VERIFY_CODE: '/api/auth/verify-code',
  AUTH_RESEND_CODE: '/api/auth/resend-code',
  AUTH_SESSION: '/api/auth/session',
  AUTH_LOGOUT: '/api/auth/logout',
  AUDIT_OVERVIEW: '/api/audit',
  EMPLOYEES: '/api/employees',
  BANDS: '/api/bands',
  SIMULATION: '/api/simulation',
  IMPORT_PAYROLL: '/api/import/payroll',
  IMPORT_BANDS: '/api/import/bands',
  SESSION_EXPORT: '/api/session/export',
  SESSION_RESTORE: '/api/session/restore',
  SESSION_RESET: '/api/session/reset',
  REPORTS_EXECUTIVE: '/api/reports/executive',
  AI_DIAGNOSTICS: '/api/ai/diagnostics',
});
