import type {
  AuditSummaryPayload,
  Employee,
  SimulationParams,
  SimulationResult,
} from '@equiwage/shared';
import {
  bandsRepository,
  employeesRepository,
  settingsRepository,
  snapshotsRepository,
} from '../repositories/index.js';
import {
  computeAuditMetrics,
  detectInternalInequities,
  detectMarketGaps,
  enrichEmployeesWithBands,
  filterDistributionAndOutliers,
  runBudgetSimulation,
  type DistributionFilterCriteria,
} from '../engines/index.js';

export class AuditService {
  /**
   * Executes the full deterministic salary audit against SQLite in < 1s (typically < 3ms).
   */
  getFullAuditSummary(): AuditSummaryPayload {
    const startNs = process.hrtime.bigint();

    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const simulation = settingsRepository.getSimulationParams();
    const payrollSource = settingsRepository.getPayrollSource();

    const employees = enrichEmployeesWithBands(rawEmployees, bands);
    const marketGaps = detectMarketGaps(employees);
    const { flaggedEmployees: inequities, flaggedIds } = detectInternalInequities(employees);
    const simulationResult = runBudgetSimulation(employees, simulation);
    const metrics = computeAuditMetrics(employees, marketGaps, flaggedIds, simulationResult);

    const computedInMs = Number(
      (Number(process.hrtime.bigint() - startNs) / 1_000_000).toFixed(2)
    );

    return {
      payrollSource,
      employees,
      bands,
      metrics,
      marketGaps,
      inequities,
      simulation,
      simulationResult,
      computedInMs,
    };
  }

  /**
   * Returns market gaps (RF-003) and filtered distribution + critical outliers (RF-006).
   */
  getDistributionAndGaps(filters: DistributionFilterCriteria = {}) {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const enriched = enrichEmployeesWithBands(rawEmployees, bands);
    const marketGaps = detectMarketGaps(enriched);
    const { filteredEmployees, criticalOutliers } = filterDistributionAndOutliers(enriched, filters);

    return {
      totalEmployees: enriched.length,
      filteredCount: filteredEmployees.length,
      employees: filteredEmployees,
      bands,
      marketGaps,
      criticalOutliers,
    };
  }

  /**
   * Returns internal salary inequities (RF-004) grouped by role and job level.
   */
  getInternalInequityReport() {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const enriched = enrichEmployeesWithBands(rawEmployees, bands);
    const { flaggedEmployees, groups } = detectInternalInequities(enriched);

    return {
      totalFlaggedEmployees: flaggedEmployees.length,
      totalInequityGroups: groups.length,
      inequities: flaggedEmployees,
      groups,
    };
  }

  /**
   * Runs a real-time budget simulation preview with optional override parameters (RF-005).
   */
  previewSimulation(overrideParams?: Partial<SimulationParams>): {
    simulation: SimulationParams;
    simulationResult: SimulationResult;
  } {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const currentSim = settingsRepository.getSimulationParams();
    const mergedSim: SimulationParams = {
      target: overrideParams?.target ?? currentSim.target,
      rolloutQuarters: overrideParams?.rolloutQuarters ?? currentSim.rolloutQuarters,
      departments: overrideParams?.departments ?? currentSim.departments,
      customAdjustmentPercent:
        overrideParams?.customAdjustmentPercent ?? currentSim.customAdjustmentPercent ?? 0,
    };

    const enriched = enrichEmployeesWithBands(rawEmployees, bands);
    const simulationResult = runBudgetSimulation(enriched, mergedSim);

    return {
      simulation: mergedSim,
      simulationResult,
    };
  }

  /**
   * Updates active simulation settings in SQLite and returns the updated full audit summary.
   */
  updateSimulationSettings(patch: Partial<SimulationParams>): AuditSummaryPayload {
    settingsRepository.updateSimulationParams(patch);
    return this.getFullAuditSummary();
  }

  /**
   * Applies the active simulation scenario adjustments directly to employee salaries in SQLite
   * and records an audit snapshot.
   */
  applySimulationScenario(scenarioName?: string): AuditSummaryPayload {
    const currentSummary = this.getFullAuditSummary();
    const adjustmentMap = new Map<string, number>();

    for (const row of currentSummary.simulationResult.rows) {
      adjustmentMap.set(row.id, row.proposedSalary);
    }

    if (adjustmentMap.size > 0) {
      const updatedEmployees: Employee[] = employeesRepository.findAll().map((emp) => ({
        ...emp,
        currentSalary: adjustmentMap.get(emp.id) ?? emp.currentSalary,
      }));

      employeesRepository.replaceAllEmployees(
        updatedEmployees,
        `${currentSummary.payrollSource} (Leveled to ${currentSummary.simulation.target})`
      );
    }

    const updatedSummary = this.getFullAuditSummary();

    snapshotsRepository.createSnapshot({
      name:
        scenarioName ||
        `Applied ${currentSummary.simulation.target} leveling (${currentSummary.simulationResult.affectedCount} employees)`,
      payrollSource: updatedSummary.payrollSource,
      headcount: updatedSummary.metrics.headcount,
      marketGapsCount: updatedSummary.metrics.marketDisparities,
      inequitiesCount: updatedSummary.metrics.inequityCount,
      totalBudget: currentSummary.simulationResult.totalBudget,
      payload: {
        appliedAdjustmentsCount: adjustmentMap.size,
        appliedBudget: currentSummary.simulationResult.totalBudget,
        simulation: currentSummary.simulation,
      },
    });

    return updatedSummary;
  }
}

export const auditService = new AuditService();
