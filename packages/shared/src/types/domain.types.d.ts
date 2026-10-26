/**
 * Core domain models and calculation interfaces for EquiWage Analytics.
 */

export type DepartmentName = 'Engineering' | 'Product' | 'Sales' | 'Marketing' | 'HR' | 'Finance' | string;

export type BandStatus = 'below' | 'aligned' | 'above' | 'unknown';

export type GapSeverity = 'legal_violation' | 'critical' | 'moderate' | 'none';

export type SimulationTarget = 'minimum' | 'median';

/**
 * Country reference data for statutory legal minimum wage compliance.
 */
export interface CountryMinimumWageReference {
  code: string;
  name: string;
  currency: string;
  defaultMinimumWage: number;
  monthlyEquivalent?: number;
  region: 'LATAM' | 'North America' | 'Europe' | 'Other' | string;
  notes?: string;
}

/**
 * Legal Minimum Wage Compliance configuration (Feature D).
 * Evaluates strictly Fixed Base Salary (excluding variable bonuses or commissions).
 */
export interface LegalComplianceConfig {
  enabled: boolean;
  countryCode: string;
  countryName: string;
  minimumWage: number;
  currency?: string;
  notes?: string;
  updatedAt?: string;
}

export type ManualAdjustmentType = 'amount' | 'percent';

/**
 * Individual Manual Salary Adjustment for 1-on-1 micro-simulations (Feature B).
 */
export interface ManualAdjustment {
  employeeId: string;
  type: ManualAdjustmentType;
  value: number;
  proposedSalary?: number;
  notes?: string;
  updatedAt?: string;
}

/**
 * Projected Market Inflation Simulation parameters (Feature C).
 * Dynamically shifts market salary bands (P25 min, P50 median, P75 max) upward by 0% to 25%.
 */
export interface InflationSimulationParams {
  inflationPercent: number;
  effectiveYear?: number;
}

export type AdjustmentReason =
  | 'Legal Compliance'
  | 'Band Minimum P25'
  | 'Market Median P50'
  | 'Individual Manual Adjustment'
  | 'Inflation Adjustment'
  | string;

/**
 * Item in the downloadable and committable Payroll Execution Order (Feature E).
 */
export interface PayrollActionPlanItem {
  employeeId: string;
  fullName: string;
  department: DepartmentName;
  level: number;
  previousSalary: number;
  increaseAmount: number;
  increasePercent: number;
  newSalary: number;
  reason: AdjustmentReason;
  notes?: string;
}

/**
 * Approved Payroll Action Plan summary and execution payload.
 */
export interface PayrollActionPlan {
  id: string;
  target: SimulationTarget | string;
  inflationPercent?: number;
  totalPreviousPayroll: number;
  totalNewPayroll: number;
  totalCost: number;
  affectedCount: number;
  items: PayrollActionPlanItem[];
  approvedBy?: string;
  createdAt: string;
}

/**
 * Market salary band for a specific job level (RF-002).
 * min = P25, median = P50, max = P75.
 */
export interface SalaryBand {
  level: number;
  min: number;
  median: number;
  max: number;
  spread?: number;
  updatedAt?: string;
}

/**
 * Base employee payroll record (RF-001).
 */
export interface Employee {
  id: string;
  name: string;
  role: string;
  department: DepartmentName;
  level: number;
  currentSalary: number;
}

/**
 * Employee record enriched by the deterministic audit engine (RF-003).
 */
export interface EnrichedEmployee extends Employee {
  band: SalaryBand | null;
  /** Relative deviation against band median: (currentSalary - median) / median */
  gap: number;
  /** Compa-ratio: currentSalary / median */
  compaRatio?: number;
  /** Band penetration: (currentSalary - min) / (max - min) */
  bandPenetration?: number;
  /** Exact dollar deviation below P25 minimum (0 if >= min) */
  minDeviationAmount?: number;
  /** Relative deviation below P25 minimum (0 if >= min) */
  minDeviationPercent?: number;
  /** Flagged if employee fixed base salary is below statutory Legal Minimum Wage */
  isBelowMinimumWage?: boolean;
  /** Exact dollar deficit below Legal Minimum Wage (0 if >= minimumWage) */
  minimumWageDeficit?: number;
  /** Proposed individual manual adjustment */
  manualAdjustment?: ManualAdjustment;
  status: BandStatus;
}

/**
 * Detailed market gap item for employees falling below P25 minimum (RF-003).
 */
export interface MarketGapItem extends EnrichedEmployee {
  deficitAmount: number;
  deficitPercent: number;
  targetMinSalary: number;
  targetMedianSalary: number;
}

/**
 * Employee flagged for internal salary inequity (> 10% spread within same role & level, RF-004).
 */
export interface InequityFlaggedEmployee extends EnrichedEmployee {
  spread: number;
  roleAverageSalary?: number;
  roleMinSalary?: number;
  roleMaxSalary?: number;
  peerCount?: number;
  severity?: GapSeverity;
}

/**
 * Policy parameters for the real-time leveling budget simulator (RF-005).
 */
export interface SimulationParams {
  target: SimulationTarget;
  rolloutQuarters: number;
  departments: DepartmentName[];
  customAdjustmentPercent?: number;
  inflationPercent?: number;
  includeLegalCompliance?: boolean;
  manualAdjustments?: ManualAdjustment[];
}

/**
 * Individual employee adjustment row computed by the simulator (RF-005).
 */
export interface SimulationAdjustmentRow extends EnrichedEmployee {
  targetSalary: number;
  proposedSalary: number;
  adjustment: number;
  severity: GapSeverity;
  adjustmentReason?: AdjustmentReason;
}

/**
 * Departmental budget breakdown in a leveling simulation (RF-005).
 */
export interface DepartmentBudgetImpact {
  department: DepartmentName;
  cost: number;
  headcount: number;
  share: number;
}

/**
 * Complete output of the real-time leveling budget simulator (RF-005).
 */
export interface SimulationResult {
  rows: SimulationAdjustmentRow[];
  totalBudget: number;
  affectedCount: number;
  averageAdjustment: number;
  byDepartment: DepartmentBudgetImpact[];
  perQuarter: number;
  quarterlySchedule?: Array<{
    quarter: number;
    label: string;
    cost: number;
    cumulativeCost: number;
  }>;
  legalComplianceCost?: number;
  bandLevelingCost?: number;
  manualAdjustmentsCost?: number;
  legalViolatorsCount?: number;
}

/**
 * Executive KPI metrics across the analyzed organization.
 */
export interface AuditMetrics {
  headcount: number;
  aligned: number;
  belowCount?: number;
  aboveCount?: number;
  alignedRate: number;
  marketDisparities: number;
  inequityCount: number;
  averageGap: number;
  averageCompaRatio?: number;
  totalPayroll?: number;
  costToBandMin?: number;
  minToMedianBudget: number;
  legalViolationsCount?: number;
  legalComplianceCost?: number;
  inflationAppliedPercent?: number;
}

/**
 * Local project session file structure (.json) for full export and restore (RF-008).
 */
export interface ProjectSessionPayload {
  app: string;
  version: number;
  savedAt: string;
  payrollSource: string;
  employees: Employee[];
  bands: SalaryBand[];
  simulation: SimulationParams;
  legalCompliance?: LegalComplianceConfig;
  manualAdjustments?: ManualAdjustment[];
}
