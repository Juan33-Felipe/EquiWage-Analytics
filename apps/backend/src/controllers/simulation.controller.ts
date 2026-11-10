import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { employeesRepository, manualAdjustmentsRepository } from '../repositories/index.js';
import { auditService } from '../services/index.js';
import { validateSimulationPatchPayload } from '../validators/simulation.validator.js';

export class SimulationController {
  /**
   * GET /api/simulation
   * Returns active simulation parameters and calculated budget impact (RF-005).
   */
  getSimulation = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const result = auditService.previewSimulation(undefined, userId);
    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PATCH /api/simulation
   * Updates simulation parameters in SQLite and returns the updated full audit state in < 1s (RNF-002).
   */
  updateSimulation = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const patch = validateSimulationPatchPayload((req.body || {}) as Record<string, unknown>);
    const audit = auditService.updateSimulationSettings(patch, userId);

    res.status(200).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/simulation/preview
   * Computes a real-time simulation preview without modifying persisted settings.
   */
  previewSimulation = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const patch = validateSimulationPatchPayload((req.body || {}) as Record<string, unknown>);
    const preview = auditService.previewSimulation(patch, userId);

    res.status(200).json({
      ok: true,
      data: {
        ...preview.simulationResult,
        ...preview,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/simulation/apply
   * Applies the active simulation adjustments to the employee payroll in SQLite.
   */
  applySimulation = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const body = (req.body || {}) as Record<string, unknown>;
    const scenarioName = typeof body.scenarioName === 'string' ? body.scenarioName : undefined;
    const audit = auditService.applySimulationScenario(scenarioName, userId);

    res.status(200).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/simulator/approve-plan (and /api/simulation/approve-plan)
   * Commits the approved adjustments and generates the official Payroll Execution Order (Feature E).
   */
  approvePayrollPlan = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id || 'USR-ADMIN-001';
    const body = (req.body || {}) as Record<string, unknown>;
    const request = {
      scenarioName: typeof body.scenarioName === 'string' ? body.scenarioName : undefined,
      commitToDatabase: Boolean(body.commitToDatabase),
      inflationPercent: body.inflationPercent !== undefined ? Number(body.inflationPercent) : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    };

    const result = auditService.approveAndGeneratePayrollPlan(request, userId);

    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/simulation/manual-adjustments
   * Lists all active individual manual salary adjustments (Feature B).
   */
  listManualAdjustments = (_req: Request, res: Response): void => {
    const list = manualAdjustmentsRepository.findAll();
    res.status(200).json({
      ok: true,
      data: list,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/simulation/manual-adjustments
   * Creates or updates a manual salary adjustment for a specific employee (Feature B).
   */
  setManualAdjustment = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const body = (req.body || {}) as Record<string, unknown>;
    const employeeId = String(body.employeeId || body.id || '').trim();

    if (!employeeId) {
      throw new AppError('Employee ID is required.', {
        statusCode: 400,
        errorKey: 'simulation.missingEmployeeId',
      });
    }

    const type = body.type === 'percent' ? 'percent' : 'amount';
    const value = Number(body.value);

    if (!Number.isFinite(value)) {
      throw new AppError('Adjustment value must be a valid number.', {
        statusCode: 400,
        errorKey: 'simulation.invalidValue',
      });
    }

    const emp = employeesRepository.findById(employeeId, userId);
    if (!emp) {
      throw new AppError(`Employee "${employeeId}" not found.`, {
        statusCode: 404,
        errorKey: 'employees.notFound',
      });
    }

    let proposedSalary = emp.currentSalary;
    if (type === 'percent') {
      proposedSalary = Math.round(emp.currentSalary * (1 + value / 100));
    } else {
      proposedSalary = Math.round(emp.currentSalary + value);
    }

    const saved = manualAdjustmentsRepository.upsertAdjustment({
      employeeId,
      type,
      value,
      proposedSalary,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    });

    const audit = auditService.getFullAuditSummary(userId);

    res.status(200).json({
      ok: true,
      data: {
        adjustment: saved,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  upsertManualAdjustment = this.setManualAdjustment;

  /**
   * DELETE /api/simulation/manual-adjustments/:employeeId
   * Removes a specific manual adjustment.
   */
  deleteManualAdjustment = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const employeeId = String(req.params.employeeId || '').trim();
    if (!employeeId) {
      throw new AppError('Employee ID is required.', {
        statusCode: 400,
        errorKey: 'simulation.missingEmployeeId',
      });
    }

    manualAdjustmentsRepository.deleteAdjustment(employeeId);
    const audit = auditService.getFullAuditSummary(userId);

    res.status(200).json({
      ok: true,
      data: {
        deletedEmployeeId: employeeId,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * DELETE /api/simulation/manual-adjustments
   * Clears all manual micro-adjustments.
   */
  clearManualAdjustments = (req: Request, res: Response): void => {
    const userId = (req as AuthenticatedRequest).user?.id;
    manualAdjustmentsRepository.clearAll();
    const audit = auditService.getFullAuditSummary(userId);

    res.status(200).json({
      ok: true,
      data: {
        cleared: true,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };
}

export const simulationController = new SimulationController();
