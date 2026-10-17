import type { Request, Response } from 'express';
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
      data: preview,
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
}

export const simulationController = new SimulationController();
