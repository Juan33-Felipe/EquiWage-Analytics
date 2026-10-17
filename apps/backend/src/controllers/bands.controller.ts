import type { Request, Response } from 'express';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { bandsRepository } from '../repositories/index.js';
import { auditService, importService } from '../services/index.js';
import { validateBandUpdatePayload } from '../validators/band.validator.js';

export class BandsController {
  /**
   * GET /api/bands
   * Returns all configured market salary bands (L1-L8+).
   */
  listBands = (_req: Request, res: Response): void => {
    const bands = bandsRepository.findAll();
    res.status(200).json({
      ok: true,
      data: {
        count: bands.length,
        bands,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * POST /api/bands
   * Adds the next sequential job level salary band (or upserts a specified level)
   * and returns the updated full audit state.
   */
  addBand = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const existingBands = bandsRepository.findAll();

    if (body.level !== undefined && body.min !== undefined && body.median !== undefined && body.max !== undefined) {
      const level = Number(body.level);
      const validated = validateBandUpdatePayload(
        { level, min: Number(body.min), median: Number(body.median), max: Number(body.max) },
        body
      );
      bandsRepository.upsertBand(validated);
    } else {
      const nextLevel =
        existingBands.length > 0
          ? Math.max(...existingBands.map((b) => b.level)) + 1
          : 1;
      const lastBand = existingBands[existingBands.length - 1];
      const base = lastBand ? lastBand.median : 50000;

      bandsRepository.upsertBand({
        level: nextLevel,
        min: base,
        median: Math.round(base * 1.2),
        max: Math.round(base * 1.4),
      });
    }

    const audit = auditService.getFullAuditSummary();
    res.status(201).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PATCH /api/bands/:level
   * Updates a specific salary band level (min, median, max) and returns the updated audit state.
   */
  updateBand = (req: Request, res: Response): void => {
    const level = Number(req.params.level);
    if (!Number.isInteger(level) || level < 1) {
      throw new AppError('Job level parameter must be a positive integer.', {
        statusCode: 400,
        errorKey: 'error.invalidJobLevel',
      });
    }

    const existing = bandsRepository.findByLevel(level) ?? {
      level,
      min: 50000,
      median: 60000,
      max: 70000,
    };

    const validated = validateBandUpdatePayload(
      existing,
      (req.body || {}) as Record<string, unknown>
    );

    bandsRepository.upsertBand(validated);

    const audit = auditService.getFullAuditSummary();
    res.status(200).json({
      ok: true,
      data: audit,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PUT /api/bands
   * Replaces the full salary band matrix in bulk and returns the updated audit state.
   */
  replaceBands = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const bands = Array.isArray(body.bands)
      ? body.bands
      : Array.isArray(req.body)
        ? req.body
        : [];

    const result = importService.importSalaryBands({
      bands,
      fileName: typeof body.sourceName === 'string' ? body.sourceName : 'Manual salary bands update',
    });

    res.status(200).json({
      ok: true,
      data: result.audit,
      timestamp: new Date().toISOString(),
    });
  };
}

export const bandsController = new BandsController();
