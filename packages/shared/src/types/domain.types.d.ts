/**
 * Core domain models and calculation interfaces for EquiWage Analytics.
 */

export type DepartmentName = 'Engineering' | 'Product' | 'Sales' | 'Marketing' | 'HR' | 'Finance' | string;

export type BandStatus = 'below' | 'aligned' | 'above' | 'unknown';

export type GapSeverity = 'critical' | 'moderate' | 'none';

export type SimulationTarget = 'minimum' | 'median';

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
}

/**
 * Individual employee adjustment row computed by the simulator (RF-005).
 */
export interface SimulationAdjustmentRow extends EnrichedEmployee {
  targetSalary: number;
  proposedSalary: number;
  adjustment: number;
  severity: GapSeverity;
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
}
