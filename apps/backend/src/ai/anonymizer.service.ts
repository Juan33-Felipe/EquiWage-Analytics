import {
  BAND_STATUS,
  DEPARTMENTS,
  hasNoPersonalIdentifiers,
  type AnonymizedAuditContext,
  type AnonymizedBandCompressionMetric,
  type AnonymizedDepartmentMetric,
  type AuditSummaryPayload,
} from '@equiwage/shared';
import { AppError } from '../middlewares/error-handler.middleware.js';

export interface AnonymizationFilterOptions {
  departmentFilter?: string;
  levelFilter?: string | number;
}

export class AnonymizerService {
  /**
   * Builds a strictly anonymized statistical snapshot from the deterministic audit state.
   * PRIVACY RULE (RF-007): Never includes employee names, IDs, or personal identifiers.
   */
  buildAnonymizedContext(
    audit: AuditSummaryPayload,
    options: AnonymizationFilterOptions = {}
  ): AnonymizedAuditContext {
    const deptFilter = options.departmentFilter || 'all';
    const lvlFilter =
      options.levelFilter !== undefined && options.levelFilter !== 'all'
        ? String(options.levelFilter)
        : 'all';

    const scopedEmployees = audit.employees.filter(
      (emp) =>
        (deptFilter === 'all' || emp.department === deptFilter) &&
        (lvlFilter === 'all' || String(emp.level) === lvlFilter)
    );

    const inequityIdSet = new Set(audit.inequities.map((item) => item.id));

    const totalEmployeesAnalyzed = scopedEmployees.length;
    const alignedCount = scopedEmployees.filter(
      (emp) => emp.status === BAND_STATUS.ALIGNED
    ).length;
    const belowBandMinimumCount = scopedEmployees.filter(
      (emp) => emp.status === BAND_STATUS.BELOW
    ).length;
    const aboveBandMaximumCount = scopedEmployees.filter(
      (emp) => emp.status === BAND_STATUS.ABOVE
    ).length;
    const internalInequityCasesCount = scopedEmployees.filter((emp) =>
      inequityIdSet.has(emp.id)
    ).length;

    const avgGapRatio =
      totalEmployeesAnalyzed > 0
        ? scopedEmployees.reduce((sum, emp) => sum + emp.gap, 0) / totalEmployeesAnalyzed
        : 0;

    const totalBudgetToBandMinimum = scopedEmployees.reduce((sum, emp) => {
      if (!emp.band || emp.currentSalary >= emp.band.min) return sum;
      return sum + (emp.band.min - emp.currentSalary);
    }, 0);

    const totalBudgetToMarketMedian = scopedEmployees.reduce((sum, emp) => {
      if (!emp.band || emp.currentSalary >= emp.band.median) return sum;
      return sum + (emp.band.median - emp.currentSalary);
    }, 0);

    const allDepartments = Array.from(
      new Set([...DEPARTMENTS, ...scopedEmployees.map((emp) => emp.department)])
    );

    const departmentBreakdown: AnonymizedDepartmentMetric[] = allDepartments
      .map((department) => {
        const deptEmps = scopedEmployees.filter((emp) => emp.department === department);
        const belowCount = deptEmps.filter((emp) => emp.status === BAND_STATUS.BELOW).length;
        const aboveCount = deptEmps.filter((emp) => emp.status === BAND_STATUS.ABOVE).length;
        const ineqCount = deptEmps.filter((emp) => inequityIdSet.has(emp.id)).length;
        const deptAvgGap =
          deptEmps.length > 0
            ? deptEmps.reduce((sum, emp) => sum + emp.gap, 0) / deptEmps.length
            : 0;
        const minBudget = deptEmps.reduce((sum, emp) => {
          if (!emp.band || emp.currentSalary >= emp.band.min) return sum;
          return sum + (emp.band.min - emp.currentSalary);
        }, 0);
        const medianBudget = deptEmps.reduce((sum, emp) => {
          if (!emp.band || emp.currentSalary >= emp.band.median) return sum;
          return sum + (emp.band.median - emp.currentSalary);
        }, 0);

        return {
          department,
          headcount: deptEmps.length,
          belowBandCount: belowCount,
          aboveBandCount: aboveCount,
          inequityFlaggedCount: ineqCount,
          averageGapPercent: Number((deptAvgGap * 100).toFixed(1)),
          requiredMinLevelingBudget: minBudget,
          requiredMedianLevelingBudget: medianBudget,
        };
      })
      .filter((dept) => dept.headcount > 0)
      .sort(
        (a, b) =>
          b.requiredMinLevelingBudget - a.requiredMinLevelingBudget ||
          b.requiredMedianLevelingBudget - a.requiredMedianLevelingBudget
      );

    const mostAffectedDepartment =
      departmentBreakdown.find((d) => d.belowBandCount > 0 || d.inequityFlaggedCount > 0)
        ?.department ||
      departmentBreakdown[0]?.department ||
      'None';

    const bandCompressionMetrics: AnonymizedBandCompressionMetric[] = audit.bands.map((band) => {
      const levelEmps = scopedEmployees.filter((emp) => emp.level === band.level);
      const avgCompa =
        levelEmps.length > 0
          ? levelEmps.reduce((sum, emp) => sum + (emp.compaRatio ?? 1), 0) / levelEmps.length
          : 1;
      const belowP25Count = levelEmps.filter((emp) => emp.status === BAND_STATUS.BELOW).length;
      const bandSpreadPercent =
        band.min > 0 ? Number((((band.max - band.min) / band.min) * 100).toFixed(1)) : 0;

      return {
        level: band.level,
        headcount: levelEmps.length,
        minSalary: band.min,
        medianSalary: band.median,
        maxSalary: band.max,
        bandSpreadPercent,
        averageCompaRatio: Number(avgCompa.toFixed(3)),
        belowP25Count,
      };
    });

    const context: AnonymizedAuditContext = {
      totalEmployeesAnalyzed,
      alignedCount,
      alignedRatePercent:
        totalEmployeesAnalyzed > 0
          ? Math.round((alignedCount / totalEmployeesAnalyzed) * 100)
          : 0,
      belowBandMinimumCount,
      aboveBandMaximumCount,
      internalInequityCasesCount,
      averageMarketGapPercent: Number((avgGapRatio * 100).toFixed(1)),
      mostAffectedDepartment,
      totalBudgetToBandMinimum,
      totalBudgetToMarketMedian,
      activeSimulationTarget: audit.simulation.target,
      activeSimulationRolloutQuarters: audit.simulation.rolloutQuarters,
      activeSimulationBudget: audit.simulationResult.totalBudget,
      departmentBreakdown,
      bandCompressionMetrics,
    };

    // Enforce zero-PII security assertion before returning
    if (!hasNoPersonalIdentifiers(context)) {
      throw new AppError(
        'Security Violation: Personal identifier detected in anonymized AI payload.',
        {
          statusCode: 500,
          errorKey: 'error.privacyGuardViolation',
        }
      );
    }

    return context;
  }
}

export const anonymizerService = new AnonymizerService();
