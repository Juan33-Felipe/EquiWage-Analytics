import type { Request, Response } from 'express';
import { auditService } from '../services/index.js';

export class AuditController {
  /**
   * GET /api/audit
   * Returns the complete deterministic salary audit state (< 1s, RNF-002).
   */
  getFullAudit = (_req: Request, res: Response): void => {
    const audit = auditService.getFullAuditSummary();
    res.status(200).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/audit/gaps
   * Returns market gaps (RF-003) and critical outliers (RF-006).
   */
  getMarketGaps = (req: Request, res: Response): void => {
    const department = typeof req.query.department === 'string' ? req.query.department : 'all';
    const level = typeof req.query.level === 'string' ? req.query.level : 'all';
    const range = typeof req.query.range === 'string' ? req.query.range : 'all';

    const result = auditService.getDistributionAndGaps({ department, level, range });
    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/audit/inequities
   * Returns internal salary inequities (> 10% spread within same role & level, RF-004).
   */
  getInternalInequities = (_req: Request, res: Response): void => {
    const result = auditService.getInternalInequityReport();
    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/audit/distribution
   * Returns scatter plot points, salary band curves, and critical outliers (RF-006).
   */
  getDistribution = (req: Request, res: Response): void => {
    const department = typeof req.query.department === 'string' ? req.query.department : 'all';
    const level = typeof req.query.level === 'string' ? req.query.level : 'all';
    const range = typeof req.query.range === 'string' ? req.query.range : 'all';

    const result = auditService.getDistributionAndGaps({ department, level, range });
    res.status(200).json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  };
}

export const auditController = new AuditController();
