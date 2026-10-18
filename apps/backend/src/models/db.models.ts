import { DEPARTMENTS, SIMULATION_TARGETS } from '@equiwage/shared';
import type { AuthUser, Employee, SalaryBand, SimulationParams, SimulationTarget } from '@equiwage/shared';

export interface UserDbRow {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  initials: string;
  password_hash: string;
  is_active: number;
  is_verified?: number;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationCodeDbRow {
  id: number;
  email: string;
  code: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  department: string;
  role: string;
  attempts: number;
  expires_at: string;
  created_at: string;
}

export function mapRowToAuthUser(row: UserDbRow): AuthUser {
  return {
    id: String(row.id),
    username: String(row.username),
    email: String(row.email),
    fullName: String(row.full_name),
    role: String(row.role),
    department: String(row.department),
    initials: String(row.initials),
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at,
  };
}

export interface SalaryBandDbRow {
  level: number;
  min_salary: number;
  median_salary: number;
  max_salary: number;
  updated_at: string;
}

export interface EmployeeDbRow {
  id: string;
  name: string;
  role: string;
  department: string;
  level: number;
  current_salary: number;
  created_at: string;
  updated_at: string;
}

export interface SimulationSettingsDbRow {
  id: number;
  target: string;
  rollout_quarters: number;
  departments_json: string;
  custom_adjustment_percent: number;
  updated_at: string;
}

export interface AppMetadataDbRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface AuditSnapshotDbRow {
  id: number;
  name: string;
  payroll_source: string;
  headcount: number;
  market_gaps_count: number;
  inequities_count: number;
  total_budget: number;
  payload_json: string;
  created_at: string;
}

export function mapRowToSalaryBand(row: SalaryBandDbRow): SalaryBand {
  return {
    level: Number(row.level),
    min: Number(row.min_salary),
    median: Number(row.median_salary),
    max: Number(row.max_salary),
    spread: Number(row.max_salary) - Number(row.min_salary),
    updatedAt: row.updated_at,
  };
}

export function mapRowToEmployee(row: EmployeeDbRow): Employee {
  return {
    id: String(row.id),
    name: String(row.name),
    role: String(row.role),
    department: String(row.department),
    level: Number(row.level),
    currentSalary: Number(row.current_salary),
  };
}

export function mapRowToSimulationParams(row?: SimulationSettingsDbRow): SimulationParams {
  if (!row) {
    return {
      target: SIMULATION_TARGETS.MINIMUM,
      rolloutQuarters: 1,
      departments: [...DEPARTMENTS],
      customAdjustmentPercent: 0,
    };
  }

  let parsedDepartments: string[] = [...DEPARTMENTS];
  try {
    const candidate = JSON.parse(row.departments_json);
    if (Array.isArray(candidate)) {
      parsedDepartments = candidate.map(String);
    }
  } catch {
    parsedDepartments = [...DEPARTMENTS];
  }

  const target: SimulationTarget =
    row.target === SIMULATION_TARGETS.MEDIAN
      ? SIMULATION_TARGETS.MEDIAN
      : SIMULATION_TARGETS.MINIMUM;

  return {
    target,
    rolloutQuarters: Math.min(Math.max(Number(row.rollout_quarters) || 1, 1), 4),
    departments: parsedDepartments,
    customAdjustmentPercent: Number(row.custom_adjustment_percent) || 0,
  };
}
