import {
  DEPARTMENTS,
  GAP_SEVERITY,
  SIMULATION_TARGETS,
} from '@equiwage/shared';
import type {
  DepartmentBudgetImpact,
  EnrichedEmployee,
  GapSeverity,
  SimulationAdjustmentRow,
  SimulationParams,
  SimulationResult,
} from '@equiwage/shared';

/**
 * Deterministic Real-Time Leveling Budget Simulator Engine (RF-005, RNF-002).
 * Calculates exact cost of leveling lagging employees to P25 (minimum) or P50 (median),
 * supporting department filtering, optional custom percentage boosts, departmental
 * cost shares, and 1-to-4 quarter phased rollout schedules.
 */
export function runBudgetSimulation(
  enrichedEmployees: EnrichedEmployee[],
  simulation: SimulationParams
): SimulationResult {
  const activeDepartments = new Set(simulation.departments);
  const customBoostMultiplier =
    simulation.customAdjustmentPercent && Number.isFinite(simulation.customAdjustmentPercent)
      ? 1 + simulation.customAdjustmentPercent / 100
      : 1;

  const includedEmployees = enrichedEmployees.filter(
    (emp) => emp.band !== null && activeDepartments.has(emp.department)
  );

  const rows: SimulationAdjustmentRow[] = includedEmployees
    .map((employee) => {
      const band = employee.band!;
      const baseTargetSalary =
        simulation.target === SIMULATION_TARGETS.MINIMUM ? band.min : band.median;
      const targetSalary = Math.round(baseTargetSalary * customBoostMultiplier);
      const adjustment = Math.max(targetSalary - employee.currentSalary, 0);

      let severity: GapSeverity = GAP_SEVERITY.NONE;
      if (employee.currentSalary < band.min) {
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
      };
    })
    .filter((row) => row.adjustment > 0)
    .sort((a, b) => b.adjustment - a.adjustment);

  const totalBudget = rows.reduce((sum, row) => sum + row.adjustment, 0);

  // Collect all unique departments (standard DEPARTMENTS + any custom imported departments)
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
  };
}
