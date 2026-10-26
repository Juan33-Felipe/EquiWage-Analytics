import {
  ADJUSTMENT_REASONS,
  DEPARTMENTS,
  GAP_SEVERITY,
  SIMULATION_TARGETS,
} from '@equiwage/shared';
import type {
  AdjustmentReason,
  DepartmentBudgetImpact,
  EnrichedEmployee,
  GapSeverity,
  LegalComplianceConfig,
  ManualAdjustment,
  SimulationAdjustmentRow,
  SimulationParams,
  SimulationResult,
} from '@equiwage/shared';

/**
 * Deterministic Real-Time Leveling Budget Simulator Engine (RF-005, RNF-002).
 * Integrates:
 * 1. Priority 1: Mandatory Legal Minimum Wage Compliance floor.
 * 2. Priority 2: Market band leveling (P25 min or P50 median) with inflation projections.
 * 3. Individual Manual Micro-adjustments.
 * 4. Categorized cost breakdown (Legal Compliance, Band Leveling, Manual Adjustments).
 */
export function runBudgetSimulation(
  enrichedEmployees: EnrichedEmployee[],
  simulation: SimulationParams,
  legalCompliance?: LegalComplianceConfig,
  manualAdjustments: ManualAdjustment[] = []
): SimulationResult {
  const activeDepartments = new Set(simulation.departments);
  const customBoostMultiplier =
    simulation.customAdjustmentPercent && Number.isFinite(simulation.customAdjustmentPercent)
      ? 1 + simulation.customAdjustmentPercent / 100
      : 1;

  const minWageEnabled = Boolean(legalCompliance?.enabled && legalCompliance.minimumWage > 0);
  const legalFloor = minWageEnabled ? Number(legalCompliance!.minimumWage) : 0;

  // Build lookup map for manual adjustments
  const manualMap = new Map<string, ManualAdjustment>();
  for (const adj of manualAdjustments) {
    manualMap.set(adj.employeeId, adj);
  }
  if (Array.isArray(simulation.manualAdjustments)) {
    for (const adj of simulation.manualAdjustments) {
      manualMap.set(adj.employeeId, adj);
    }
  }

  // Include employees that belong to selected departments OR have a mandatory legal violation
  const candidateEmployees = enrichedEmployees.filter(
    (emp) =>
      emp.band !== null &&
      (activeDepartments.has(emp.department) || (legalFloor > 0 && emp.currentSalary < legalFloor))
  );

  let legalComplianceCost = 0;
  let manualAdjustmentsCost = 0;
  let legalViolatorsCount = 0;

  const rows: SimulationAdjustmentRow[] = candidateEmployees
    .map((employee) => {
      const band = employee.band!;
      const manualAdj = manualMap.get(employee.id) || employee.manualAdjustment;
      const isBelowMinWage = legalFloor > 0 && employee.currentSalary < legalFloor;

      if (isBelowMinWage) {
        legalViolatorsCount++;
      }

      let targetSalary = employee.currentSalary;
      let adjustment = 0;
      let reason: AdjustmentReason = simulation.target === SIMULATION_TARGETS.MINIMUM
        ? ADJUSTMENT_REASONS.BAND_MINIMUM
        : ADJUSTMENT_REASONS.MARKET_MEDIAN;

      if (manualAdj) {
        // Individual manual adjustment takes explicit precedence
        let proposed = employee.currentSalary;
        if (manualAdj.type === 'percent') {
          proposed = Math.round(employee.currentSalary * (1 + manualAdj.value / 100));
        } else {
          proposed = Math.round(employee.currentSalary + manualAdj.value);
        }

        // Legal compliance floor is always mandatory if enabled
        if (legalFloor > 0 && proposed < legalFloor) {
          proposed = legalFloor;
        }

        targetSalary = proposed;
        adjustment = Math.max(0, targetSalary - employee.currentSalary);
        reason = ADJUSTMENT_REASONS.MANUAL_ADJUSTMENT;
        manualAdjustmentsCost += adjustment;
      } else {
        // Standard macro simulation logic
        const baseTargetSalary =
          simulation.target === SIMULATION_TARGETS.MINIMUM ? band.min : band.median;
        const leveledTarget = Math.round(baseTargetSalary * customBoostMultiplier);

        // Priority 1: Bring up to legal floor first
        targetSalary = Math.max(leveledTarget, legalFloor);
        adjustment = Math.max(targetSalary - employee.currentSalary, 0);

        if (adjustment > 0) {
          if (isBelowMinWage) {
            reason = ADJUSTMENT_REASONS.LEGAL_COMPLIANCE;
            const legalPortion = Math.min(adjustment, legalFloor - employee.currentSalary);
            legalComplianceCost += legalPortion;
          } else if (simulation.inflationPercent && simulation.inflationPercent > 0) {
            reason = ADJUSTMENT_REASONS.INFLATION;
          }
        }
      }

      let severity: GapSeverity = GAP_SEVERITY.NONE;
      if (isBelowMinWage) {
        severity = GAP_SEVERITY.LEGAL_VIOLATION;
      } else if (employee.currentSalary < band.min) {
        severity = GAP_SEVERITY.CRITICAL;
      } else if (employee.currentSalary < band.median) {
        severity = GAP_SEVERITY.MODERATE;
      }

      return {
        ...employee,
        targetSalary,
        proposedSalary: employee.currentSalary + adjustment,
        adjustment,
        severity,
        adjustmentReason: reason,
      };
    })
    .filter((row) => row.adjustment > 0)
    .sort((a, b) => {
      // Prioritize Legal Minimum Wage violations at the top of adjustment tables
      if (a.severity === GAP_SEVERITY.LEGAL_VIOLATION && b.severity !== GAP_SEVERITY.LEGAL_VIOLATION) {
        return -1;
      }
      if (b.severity === GAP_SEVERITY.LEGAL_VIOLATION && a.severity !== GAP_SEVERITY.LEGAL_VIOLATION) {
        return 1;
      }
      return b.adjustment - a.adjustment;
    });

  const totalBudget = rows.reduce((sum, row) => sum + row.adjustment, 0);
  const bandLevelingCost = Math.max(0, totalBudget - legalComplianceCost - manualAdjustmentsCost);

  // Departmental breakdown
  const allDepartments = Array.from(
    new Set([...DEPARTMENTS, ...rows.map((row) => row.department)])
  );

  const byDepartment: DepartmentBudgetImpact[] = allDepartments
    .map((department) => {
      const deptRows = rows.filter((row) => row.department === department);
      const cost = deptRows.reduce((sum, row) => sum + row.adjustment, 0);
      return {
        department,
        cost,
        headcount: deptRows.length,
        share: totalBudget > 0 ? cost / totalBudget : 0,
      };
    })
    .filter((item) => item.cost > 0)
    .sort((a, b) => b.cost - a.cost);

  const quarters = Math.min(Math.max(Number(simulation.rolloutQuarters) || 1, 1), 4);
  const perQuarter = totalBudget / quarters;

  const quarterlySchedule = Array.from({ length: quarters }, (_, index) => {
    const quarterNumber = index + 1;
    return {
      quarter: quarterNumber,
      label: `Q${quarterNumber}`,
      cost: Math.round(perQuarter),
      cumulativeCost: Math.round(perQuarter * quarterNumber),
    };
  });

  return {
    rows,
    totalBudget,
    affectedCount: rows.length,
    averageAdjustment: rows.length > 0 ? totalBudget / rows.length : 0,
    byDepartment,
    perQuarter,
    quarterlySchedule,
    legalComplianceCost,
    bandLevelingCost,
    manualAdjustmentsCost,
    legalViolatorsCount,
  };
}
