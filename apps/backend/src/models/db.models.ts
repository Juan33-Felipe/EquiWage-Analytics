import { DEPARTMENTS, SIMULATION_TARGETS } from '@equiwage/shared';
import type {
  AuthUser,
  CountryMinimumWageReference,
  Employee,
  LegalComplianceConfig,
  ManualAdjustment,
  ManualAdjustmentType,
  PayrollActionPlan,
  PayrollActionPlanItem,
  SalaryBand,
  SimulationParams,
  SimulationTarget,
} from '@equiwage/shared';

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
  inflation_percent?: number;
  include_legal_compliance?: number;
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
      inflationPercent: 0,
      includeLegalCompliance: true,
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
    inflationPercent: Number(row.inflation_percent) || 0,
    includeLegalCompliance: row.include_legal_compliance !== 0,
  };
}

export interface LegalComplianceSettingsDbRow {
  id: number;
  enabled: number;
  country_code: string;
  country_name: string;
  minimum_wage: number;
  currency: string;
  notes: string | null;
  updated_at: string;
}

export interface ReferenceCountryDbRow {
  code: string;
  name: string;
  currency: string;
  default_minimum_wage: number;
  monthly_equivalent: number | null;
  region: string;
  notes: string | null;
  updated_at: string;
}

export interface ManualAdjustmentDbRow {
  employee_id: string;
  adjustment_type: string;
  adjustment_value: number;
  proposed_salary: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollActionPlanDbRow {
  id: string;
  target: string;
  inflation_percent: number;
  total_previous_payroll: number;
  total_new_payroll: number;
  total_cost: number;
  affected_count: number;
  items_json: string;
  approved_by: string | null;
  created_at: string;
}

export function mapRowToLegalComplianceConfig(row?: LegalComplianceSettingsDbRow): LegalComplianceConfig {
  if (!row) {
    return {
      enabled: true,
      countryCode: 'US',
      countryName: 'United States',
      minimumWage: 42000,
      currency: 'USD',
      notes: 'Legal minimum wage validation strictly evaluates Fixed Base Salary (excluding variable bonuses or commissions).',
    };
  }

  return {
    enabled: Boolean(row.enabled),
    countryCode: String(row.country_code),
    countryName: String(row.country_name),
    minimumWage: Number(row.minimum_wage),
    currency: String(row.currency || 'USD'),
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function mapRowToReferenceCountry(row: ReferenceCountryDbRow): CountryMinimumWageReference {
  return {
    code: String(row.code),
    name: String(row.name),
    currency: String(row.currency),
    defaultMinimumWage: Number(row.default_minimum_wage),
    monthlyEquivalent: row.monthly_equivalent !== null ? Number(row.monthly_equivalent) : undefined,
    region: String(row.region),
    notes: row.notes ?? undefined,
  };
}

export function mapRowToManualAdjustment(row: ManualAdjustmentDbRow): ManualAdjustment {
  const type: ManualAdjustmentType = row.adjustment_type === 'percent' ? 'percent' : 'amount';
  return {
    employeeId: String(row.employee_id),
    type,
    value: Number(row.adjustment_value),
    proposedSalary: Number(row.proposed_salary),
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

export function mapRowToPayrollActionPlan(row: PayrollActionPlanDbRow): PayrollActionPlan {
  let items: PayrollActionPlanItem[] = [];
  try {
    const parsed = JSON.parse(row.items_json);
    if (Array.isArray(parsed)) {
      items = parsed;
    }
  } catch {
    items = [];
  }

  return {
    id: String(row.id),
    target: String(row.target),
    inflationPercent: Number(row.inflation_percent || 0),
    totalPreviousPayroll: Number(row.total_previous_payroll),
    totalNewPayroll: Number(row.total_new_payroll),
    totalCost: Number(row.total_cost),
    affectedCount: Number(row.affected_count),
    items,
    approvedBy: row.approved_by ?? undefined,
    createdAt: row.created_at,
  };
}
