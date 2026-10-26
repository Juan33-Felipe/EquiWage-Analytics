import { BAND_STATUS } from '@equiwage/shared';
import type {
  AuditMetrics,
  EnrichedEmployee,
  MarketGapItem,
  SimulationResult,
} from '@equiwage/shared';

/**
 * Computes organizational KPI metrics for the Executive Overview and Reports modules.
 */
export function computeAuditMetrics(
  enrichedEmployees: EnrichedEmployee[],
  marketGaps: MarketGapItem[],
  inequityIds: Set<string>,
  simulationResult: SimulationResult
): AuditMetrics {
  const total = enrichedEmployees.length;
  const aligned = enrichedEmployees.filter((emp) => emp.status === BAND_STATUS.ALIGNED).length;
  const belowCount = enrichedEmployees.filter((emp) => emp.status === BAND_STATUS.BELOW).length;
  const aboveCount = enrichedEmployees.filter((emp) => emp.status === BAND_STATUS.ABOVE).length;

  const averageGap =
    total > 0
      ? enrichedEmployees.reduce((sum, emp) => sum + emp.gap, 0) / total
      : 0;

  const averageCompaRatio =
    total > 0
      ? enrichedEmployees.reduce((sum, emp) => sum + (emp.compaRatio ?? 1), 0) / total
      : 1;

  const totalPayroll = enrichedEmployees.reduce(
    (sum, emp) => sum + emp.currentSalary,
    0
  );

  const costToBandMin = marketGaps.reduce(
    (sum, gapItem) => sum + gapItem.deficitAmount,
    0
  );

  const legalViolators = enrichedEmployees.filter((emp) => emp.isBelowMinimumWage);
  const legalViolationsCount = legalViolators.length;
  const legalComplianceCost =
    simulationResult.legalComplianceCost !== undefined
      ? simulationResult.legalComplianceCost
      : legalViolators.reduce((sum, emp) => sum + (emp.minimumWageDeficit ?? 0), 0);

  return {
    headcount: total,
    aligned,
    belowCount,
    aboveCount,
    alignedRate: total > 0 ? aligned / total : 0,
    marketDisparities: marketGaps.length,
    inequityCount: inequityIds.size,
    averageGap,
    averageCompaRatio,
    totalPayroll,
    costToBandMin,
    minToMedianBudget: simulationResult.totalBudget,
    legalViolationsCount,
    legalComplianceCost,
  };
}
