import type { Request, Response } from 'express';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { employeesRepository, manualAdjustmentsRepository } from '../repositories/index.js';
import { auditService } from '../services/index.js';
import { validateSimulationPatchPayload } from '../validators/simulation.validator.js';

export class SimulationController {
  /**
   * GET /api/simulation
   * Returns active simulation parameters and calculated budget impact (RF-005).
   */
  getSimulation = (_req: Request, res: Response): void => {
    const result = auditService.previewSimulation();
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
    const patch = validateSimulationPatchPayload((req.body || {}) as Record<string, unknown>);
    const audit = auditService.updateSimulationSettings(patch);

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
    const patch = validateSimulationPatchPayload((req.body || {}) as Record<string, unknown>);
    const preview = auditService.previewSimulation(patch);

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
    const body = (req.body || {}) as Record<string, unknown>;
    const scenarioName = typeof body.scenarioName === 'string' ? body.scenarioName : undefined;
    const audit = auditService.applySimulationScenario(scenarioName);

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
    const body = (req.body || {}) as Record<string, unknown>;
    const request = {
      scenarioName: typeof body.scenarioName === 'string' ? body.scenarioName : undefined,
      commitToDatabase: Boolean(body.commitToDatabase),
      inflationPercent: body.inflationPercent !== undefined ? Number(body.inflationPercent) : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    };

    const currentUserId = (req as unknown as { user?: { id?: string } }).user?.id || 'USR-ADMIN-001';
    const result = auditService.approveAndGeneratePayrollPlan(request, currentUserId);

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
   * Sets or updates a 1-on-1 micro-simulation manual adjustment (Feature B).
   */
  upsertManualAdjustment = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const employeeId = String(body.employeeId || req.params.employeeId || '').trim();

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

    const emp = employeesRepository.findById(employeeId);
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

    const audit = auditService.getFullAuditSummary();

    res.status(200).json({
      ok: true,
      data: {
        adjustment: saved,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * DELETE /api/simulation/manual-adjustments/:employeeId
   * Removes a specific manual adjustment.
   */
  deleteManualAdjustment = (req: Request, res: Response): void => {
    const employeeId = String(req.params.employeeId || '').trim();
    if (!employeeId) {
      throw new AppError('Employee ID is required.', {
        statusCode: 400,
        errorKey: 'simulation.missingEmployeeId',
      });
    }

    manualAdjustmentsRepository.deleteAdjustment(employeeId);
    const audit = auditService.getFullAuditSummary();

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
  clearManualAdjustments = (_req: Request, res: Response): void => {
    manualAdjustmentsRepository.clearAll();
    const audit = auditService.getFullAuditSummary();

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
