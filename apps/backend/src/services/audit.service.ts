import type {
  ApprovePlanRequest,
  ApprovePlanResponse,
  AuditSummaryPayload,
  Employee,
  PayrollActionPlan,
  PayrollActionPlanItem,
  SimulationParams,
  SimulationResult,
} from '@equiwage/shared';
import {
  bandsRepository,
  complianceRepository,
  employeesRepository,
  manualAdjustmentsRepository,
  payrollPlansRepository,
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
   * Fully integrates Legal Minimum Wage compliance, market inflation, and manual micro-adjustments.
   */
  getFullAuditSummary(): AuditSummaryPayload {
    const startNs = process.hrtime.bigint();

    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const simulation = settingsRepository.getSimulationParams();
    const payrollSource = settingsRepository.getPayrollSource();
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const referenceCountries = complianceRepository.getReferenceCountries();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    const employees = enrichEmployeesWithBands(rawEmployees, bands, {
      inflationPercent: simulation.inflationPercent,
      legalCompliance,
      manualAdjustments,
    });

    const marketGaps = detectMarketGaps(employees);
    const { flaggedEmployees: inequities, flaggedIds } = detectInternalInequities(employees);
    const simulationResult = runBudgetSimulation(
      employees,
      simulation,
      legalCompliance,
      manualAdjustments
    );
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
      legalCompliance,
      referenceCountries,
      manualAdjustments,
      computedInMs,
    };
  }

  /**
   * Returns market gaps (RF-003) and filtered distribution + critical outliers (RF-006).
   */
  getDistributionAndGaps(filters: DistributionFilterCriteria = {}) {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const simulation = settingsRepository.getSimulationParams();
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    const enriched = enrichEmployeesWithBands(rawEmployees, bands, {
      inflationPercent: simulation.inflationPercent,
      legalCompliance,
      manualAdjustments,
    });
    const marketGaps = detectMarketGaps(enriched);
    const { filteredEmployees, criticalOutliers } = filterDistributionAndOutliers(enriched, filters);

    return {
      totalEmployees: enriched.length,
      filteredCount: filteredEmployees.length,
      employees: filteredEmployees,
      bands,
      marketGaps,
      criticalOutliers,
      legalCompliance,
    };
  }

  /**
   * Returns internal salary inequities (RF-004) grouped by role and job level.
   */
  getInternalInequityReport() {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const simulation = settingsRepository.getSimulationParams();
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    const enriched = enrichEmployeesWithBands(rawEmployees, bands, {
      inflationPercent: simulation.inflationPercent,
      legalCompliance,
      manualAdjustments,
    });
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
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    const mergedSim: SimulationParams = {
      target: overrideParams?.target ?? currentSim.target,
      rolloutQuarters: overrideParams?.rolloutQuarters ?? currentSim.rolloutQuarters,
      departments: overrideParams?.departments ?? currentSim.departments,
      customAdjustmentPercent:
        overrideParams?.customAdjustmentPercent ?? currentSim.customAdjustmentPercent ?? 0,
      inflationPercent:
        overrideParams?.inflationPercent !== undefined
          ? Number(overrideParams.inflationPercent)
          : currentSim.inflationPercent ?? 0,
      includeLegalCompliance:
        overrideParams?.includeLegalCompliance !== undefined
          ? Boolean(overrideParams.includeLegalCompliance)
          : currentSim.includeLegalCompliance ?? true,
      manualAdjustments: overrideParams?.manualAdjustments ?? manualAdjustments,
    };

    const enriched = enrichEmployeesWithBands(rawEmployees, bands, {
      inflationPercent: mergedSim.inflationPercent,
      legalCompliance: mergedSim.includeLegalCompliance !== false ? legalCompliance : undefined,
      manualAdjustments: mergedSim.manualAdjustments,
    });

    const simulationResult = runBudgetSimulation(
      enriched,
      mergedSim,
      mergedSim.includeLegalCompliance !== false ? legalCompliance : undefined,
      mergedSim.manualAdjustments
    );

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
   * Generates a structured Payroll Action Plan dataset, optionally commits the new salaries
   * to SQLite, logs an audit snapshot, and returns the downloadable execution order.
   */
  approveAndGeneratePayrollPlan(
    request: ApprovePlanRequest = {},
    currentUserId?: string
  ): ApprovePlanResponse {
    const rawEmployees = employeesRepository.findAll();
    const bands = bandsRepository.findAll();
    const currentSim = settingsRepository.getSimulationParams();
    const legalCompliance = complianceRepository.getLegalComplianceConfig();
    const manualAdjustments = manualAdjustmentsRepository.findAll();

    const effectiveInflation =
      request.inflationPercent !== undefined
        ? Number(request.inflationPercent)
        : currentSim.inflationPercent ?? 0;

    const simConfig: SimulationParams = {
      ...currentSim,
      inflationPercent: effectiveInflation,
    };

    const enriched = enrichEmployeesWithBands(rawEmployees, bands, {
      inflationPercent: effectiveInflation,
      legalCompliance,
      manualAdjustments,
    });

    const simulationResult = runBudgetSimulation(
      enriched,
      simConfig,
      legalCompliance,
      manualAdjustments
    );

    const exportRows: PayrollActionPlanItem[] = simulationResult.rows.map((row) => {
      const previousSalary = row.currentSalary;
      const newSalary = row.proposedSalary;
      const increaseAmount = row.adjustment;
      const increasePercent =
        previousSalary > 0
          ? Number(((increaseAmount / previousSalary) * 100).toFixed(2))
          : 0;

      return {
        employeeId: row.id,
        fullName: row.name,
        department: row.department,
        level: row.level,
        previousSalary,
        increaseAmount,
        increasePercent,
        newSalary,
        reason: row.adjustmentReason || 'Band Minimum P25',
        notes: row.manualAdjustment?.notes,
      };
    });

    const totalPreviousPayroll = rawEmployees.reduce((sum, e) => sum + e.currentSalary, 0);
    const totalNewPayroll = totalPreviousPayroll + simulationResult.totalBudget;

    const planId = `PLAN-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const plan: PayrollActionPlan = {
      id: planId,
      target: simConfig.target,
      inflationPercent: effectiveInflation,
      totalPreviousPayroll,
      totalNewPayroll,
      totalCost: simulationResult.totalBudget,
      affectedCount: exportRows.length,
      items: exportRows,
      approvedBy: currentUserId,
      createdAt: now,
    };

    // Save plan history
    payrollPlansRepository.saveActionPlan(plan);

    // If commitToDatabase is true, apply raises to active payroll
    if (request.commitToDatabase && exportRows.length > 0) {
      const salaryMap = new Map<string, number>();
      for (const item of exportRows) {
        salaryMap.set(item.employeeId, item.newSalary);
      }

      const updatedEmployees: Employee[] = rawEmployees.map((emp) => ({
        ...emp,
        currentSalary: salaryMap.get(emp.id) ?? emp.currentSalary,
      }));

      employeesRepository.replaceAllEmployees(
        updatedEmployees,
        `${settingsRepository.getPayrollSource()} (Approved Plan ${planId})`
      );

      // Clear obsolete manual adjustments once committed
      manualAdjustmentsRepository.clearAll();

      snapshotsRepository.createSnapshot({
        name:
          request.scenarioName ||
          `Approved Payroll Order (${plan.affectedCount} adjustments, +$${plan.totalCost.toLocaleString()})`,
        payrollSource: settingsRepository.getPayrollSource(),
        headcount: updatedEmployees.length,
        marketGapsCount: 0,
        inequitiesCount: 0,
        totalBudget: plan.totalCost,
        payload: {
          planId: plan.id,
          target: plan.target,
          totalCost: plan.totalCost,
          affectedCount: plan.affectedCount,
          committedAt: now,
        },
      });
    }

    return {
      plan,
      committed: Boolean(request.commitToDatabase),
      updatedEmployeeCount: request.commitToDatabase ? exportRows.length : 0,
      exportRows,
      timestamp: now,
    };
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
