import type { Request, Response, NextFunction } from 'express';
import type { AiExecutiveDiagnosticRequest } from '@equiwage/shared';
import { envConfig } from '../config/env.config.js';
import { aiDiagnosticsService } from '../ai/index.js';

export class AiController {
  /**
   * GET /api/ai/status
   * Reports AI provider configuration, anonymization enforcement, and fallback readiness.
   */
  getStatus = (_req: Request, res: Response): void => {
    res.status(200).json({
      ok: true,
      data: {
        configured: envConfig.ai.isConfigured,
        provider: envConfig.ai.provider,
        model: envConfig.ai.model,
        anonymizationEnabled: true,
        fallbackReady: true,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/ai/anonymized-preview
   * Returns the exact anonymized statistical payload that is permitted to be sent
   * to the external LLM API, proving zero employee names or personal IDs are included.
   */
  getAnonymizedPreview = (req: Request, res: Response): void => {
    const departmentFilter =
      typeof req.query.department === 'string' ? req.query.department : 'all';
    const levelFilter = typeof req.query.level === 'string' ? req.query.level : 'all';

    const preview = aiDiagnosticsService.getAnonymizedSnapshot({
      departmentFilter,
      levelFilter,
    });

    res.status(200).json({
      ok: true,
      data: preview,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/ai/diagnostics
   * Generates an executive narrative diagnostic, statistical findings, departmental
   * action plans, and rollout recommendations (RF-007).
   */
  generateDiagnostics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = (req.body || {}) as AiExecutiveDiagnosticRequest;
      const diagnostic = await aiDiagnosticsService.generateExecutiveDiagnostics(body);

      res.status(200).json({
        ok: true,
        data: diagnostic,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController = new AiController();
