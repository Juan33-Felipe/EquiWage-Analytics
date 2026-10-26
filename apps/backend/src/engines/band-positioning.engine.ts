import { BAND_STATUS } from '@equiwage/shared';
import type {
  BandStatus,
  Employee,
  EnrichedEmployee,
  LegalComplianceConfig,
  ManualAdjustment,
  MarketGapItem,
  SalaryBand,
} from '@equiwage/shared';

export interface EnrichmentOptions {
  inflationPercent?: number;
  legalCompliance?: LegalComplianceConfig;
  manualAdjustments?: ManualAdjustment[];
}

/**
 * Builds an O(1) lookup dictionary mapping job level -> SalaryBand.
 * Optionally applies projected market inflation multiplier (0% to +25%).
 */
export function buildBandMap(
  bands: SalaryBand[],
  inflationPercent: number = 0
): Record<number, SalaryBand> {
  const mult = inflationPercent > 0 ? 1 + inflationPercent / 100 : 1;
  const map: Record<number, SalaryBand> = {};

  for (const band of bands) {
    if (mult === 1) {
      map[band.level] = band;
    } else {
      const min = Math.round(band.min * mult);
      const median = Math.round(band.median * mult);
      const max = Math.round(band.max * mult);
      map[band.level] = {
        ...band,
        min,
        median,
        max,
        spread: max - min,
      };
    }
  }
  return map;
}

/**
 * Enriches raw employee records with their corresponding salary band,
 * relative gap to median, compa-ratio, band penetration, and alignment status (RF-003).
 * Seamlessly integrates legal compliance minimum wage checks, inflation, and manual adjustments.
 */
export function enrichEmployeesWithBands(
  employees: Employee[],
  bands: SalaryBand[],
  options: EnrichmentOptions = {}
): EnrichedEmployee[] {
  const inflationPercent = Math.max(0, options.inflationPercent ?? 0);
  const bandMap = buildBandMap(bands, inflationPercent);
  const minWage =
    options.legalCompliance?.enabled && options.legalCompliance.minimumWage > 0
      ? options.legalCompliance.minimumWage
      : 0;

  const adjustmentsMap = new Map<string, ManualAdjustment>();
  if (Array.isArray(options.manualAdjustments)) {
    for (const adj of options.manualAdjustments) {
      adjustmentsMap.set(adj.employeeId, adj);
    }
  }

  return employees.map((employee) => {
    const band = bandMap[employee.level] ?? null;
    const manualAdjustment = adjustmentsMap.get(employee.id);
    const isBelowMinimumWage = minWage > 0 && employee.currentSalary < minWage;
    const minimumWageDeficit = isBelowMinimumWage ? Math.round(minWage - employee.currentSalary) : 0;

    if (!band) {
      return {
        ...employee,
        band: null,
        gap: 0,
        compaRatio: 0,
        bandPenetration: 0,
        minDeviationAmount: 0,
        minDeviationPercent: 0,
        isBelowMinimumWage,
        minimumWageDeficit,
        manualAdjustment,
        status: BAND_STATUS.UNKNOWN as BandStatus,
      };
    }

    const gap = band.median > 0 ? (employee.currentSalary - band.median) / band.median : 0;
    const compaRatio = band.median > 0 ? employee.currentSalary / band.median : 0;
    const bandRange = band.max - band.min;
    const bandPenetration =
      bandRange > 0 ? (employee.currentSalary - band.min) / bandRange : 0;

    let status: BandStatus = BAND_STATUS.ALIGNED;
    let minDeviationAmount = 0;
    let minDeviationPercent = 0;

    if (employee.currentSalary < band.min) {
      status = BAND_STATUS.BELOW;
      minDeviationAmount = band.min - employee.currentSalary;
      minDeviationPercent = band.min > 0 ? minDeviationAmount / band.min : 0;
    } else if (employee.currentSalary > band.max) {
      status = BAND_STATUS.ABOVE;
    }

    return {
      ...employee,
      band,
      gap,
      compaRatio,
      bandPenetration,
      minDeviationAmount,
      minDeviationPercent,
      isBelowMinimumWage,
      minimumWageDeficit,
      manualAdjustment,
      status,
    };
  });
}

/**
 * Identifies all employees whose current salary falls below the minimum (P25)
 * of their corresponding salary band (RF-003), sorted by largest deficit first.
 */
export function detectMarketGaps(enrichedEmployees: EnrichedEmployee[]): MarketGapItem[] {
  return enrichedEmployees
    .filter((emp): emp is EnrichedEmployee & { band: SalaryBand } => emp.status === BAND_STATUS.BELOW && emp.band !== null)
    .map((emp) => {
      const deficitAmount = Math.max(emp.band.min - emp.currentSalary, 0);
      const deficitPercent = emp.band.min > 0 ? deficitAmount / emp.band.min : 0;
      return {
        ...emp,
        deficitAmount,
        deficitPercent,
        targetMinSalary: emp.band.min,
        targetMedianSalary: emp.band.median,
      };
    })
    .sort((a, b) => b.deficitAmount - a.deficitAmount);
}

export interface DistributionFilterCriteria {
  department?: string;
  level?: string | number;
  range?: 'all' | 'below' | 'above' | 'P25-P50' | 'P50-P75' | string;
}

/**
 * Filters enriched employees for the salary curve scatter plot and extracts
 * critical below-band outliers (RF-006).
 */
export function filterDistributionAndOutliers(
  enrichedEmployees: EnrichedEmployee[],
  filters: DistributionFilterCriteria = {}
): {
  filteredEmployees: EnrichedEmployee[];
  criticalOutliers: EnrichedEmployee[];
} {
  const { department = 'all', level = 'all', range = 'all' } = filters;

  const filteredEmployees = enrichedEmployees.filter((employee) => {
    if (department !== 'all' && employee.department !== department) {
      return false;
    }
    if (level !== 'all' && String(employee.level) !== String(level)) {
      return false;
    }
    if (range !== 'all' && employee.band) {
      const { currentSalary, band } = employee;
      if (range === 'below' && currentSalary >= band.min) return false;
      if (range === 'above' && currentSalary <= band.max) return false;
      if (range === 'P25-P50' && !(currentSalary >= band.min && currentSalary <= band.median)) return false;
      if (range === 'P50-P75' && !(currentSalary > band.median && currentSalary <= band.max)) return false;
    }
    return true;
  });

  const criticalOutliers = [...filteredEmployees]
    .filter((employee) => employee.status === BAND_STATUS.BELOW)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 8);

  return {
    filteredEmployees,
    criticalOutliers,
  };
}
