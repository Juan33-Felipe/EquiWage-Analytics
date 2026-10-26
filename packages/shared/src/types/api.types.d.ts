import type {
  AuditMetrics,
  CountryMinimumWageReference,
  DepartmentName,
  Employee,
  EnrichedEmployee,
  InequityFlaggedEmployee,
  LegalComplianceConfig,
  ManualAdjustment,
  MarketGapItem,
  PayrollActionPlan,
  PayrollActionPlanItem,
  SalaryBand,
  SimulationParams,
  SimulationResult,
} from './domain.types.js';

/**
 * Standard API success wrapper.
 */
export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
  timestamp: string;
}

/**
 * User-friendly, structured API error response (RNF-003).
 */
export interface ApiErrorResponse {
  ok: false;
  errorKey: string;
  message: string;
  missingColumns?: string[];
  details?: Array<{
    row?: number;
    field?: string;
    issue: string;
  }>;
  timestamp: string;
}

/**
 * Complete deterministic audit payload returned by the backend (< 1s, RNF-002).
 */
export interface AuditSummaryPayload {
  payrollSource: string;
  employees: EnrichedEmployee[];
  bands: SalaryBand[];
  metrics: AuditMetrics;
  marketGaps: MarketGapItem[];
  inequities: InequityFlaggedEmployee[];
  simulation: SimulationParams;
  simulationResult: SimulationResult;
  legalCompliance?: LegalComplianceConfig;
  referenceCountries?: CountryMinimumWageReference[];
  manualAdjustments?: ManualAdjustment[];
  computedInMs?: number;
}

/**
 * Employee CRUD payloads (Feature A).
 */
export interface EmployeeCreatePayload {
  id?: string;
  name: string;
  role: string;
  department: DepartmentName;
  level: number;
  currentSalary: number;
}

export interface EmployeeUpdatePayload {
  name?: string;
  role?: string;
  department?: DepartmentName;
  level?: number;
  currentSalary?: number;
  manualAdjustment?: ManualAdjustment;
}

/**
 * Legal Compliance update payload (Feature D).
 */
export interface LegalComplianceUpdatePayload {
  enabled?: boolean;
  countryCode?: string;
  countryName?: string;
  minimumWage?: number;
  currency?: string;
  notes?: string;
}

/**
 * Manual adjustment update payload (Feature B).
 */
export interface ManualAdjustmentPayload {
  employeeId: string;
  type: 'amount' | 'percent';
  value: number;
  notes?: string;
}

/**
 * Payroll Action Plan approval and export request/response (Feature E).
 */
export interface ApprovePlanRequest {
  scenarioName?: string;
  commitToDatabase?: boolean;
  inflationPercent?: number;
  notes?: string;
}

export interface ApprovePlanResponse {
  plan: PayrollActionPlan;
  committed: boolean;
  updatedEmployeeCount: number;
  exportRows: PayrollActionPlanItem[];
  timestamp: string;
}

/**
 * Result of validating and importing a CSV/XLSX payroll or salary bands file (RF-001, RF-002, RNF-003).
 */
export interface ImportValidationResult<T> {
  ok: boolean;
  data?: T[];
  rowCount?: number;
  missingColumns?: string[];
  invalidRows?: Array<{
    rowNumber: number;
    reason: string;
  }>;
  errorKey?: string;
  message?: string;
}

/**
 * Request payload for generating structured executive reports (RF-007).
 */
export interface ReportExportRequest {
  department?: string;
  level?: string | number;
  sections: string[];
  format: 'pdf' | 'xlsx' | 'json';
  language?: 'en' | 'es';
}

/**
 * Backend health & database diagnostic response.
 */
export interface HealthCheckResponse {
  ok: boolean;
  service: string;
  version: string;
  database: {
    connected: boolean;
    engine: 'sqlite';
    employeeCount: number;
    bandCount: number;
    payrollSource: string;
  };
  ai: {
    configured: boolean;
    provider: string;
    anonymizationEnabled: true;
  };
  uptimeSeconds: number;
  timestamp: string;
}
