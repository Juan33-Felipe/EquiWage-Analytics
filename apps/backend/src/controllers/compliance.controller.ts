import type { Request, Response } from 'express';
import { AppError } from '../middlewares/error-handler.middleware.js';
import { complianceRepository } from '../repositories/index.js';
import { auditService } from '../services/index.js';

export class ComplianceController {
  /**
   * GET /api/compliance/minimum-wage
   * Retrieves active statutory legal minimum wage configuration (Feature D).
   */
  getMinimumWageConfig = (_req: Request, res: Response): void => {
    const config = complianceRepository.getLegalComplianceConfig();
    res.status(200).json({
      ok: true,
      data: config,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PUT /api/compliance/minimum-wage
   * Updates statutory legal minimum wage settings and recalculates entire audit in < 1s (Feature D).
   */
  updateMinimumWageConfig = (req: Request, res: Response): void => {
    const body = (req.body || {}) as Record<string, unknown>;
    const patch: Parameters<typeof complianceRepository.updateLegalComplianceConfig>[0] = {};

    if (body.enabled !== undefined) {
      patch.enabled = Boolean(body.enabled);
    }

    const countryCode = body.countryCode ?? body.country_code;
    if (typeof countryCode === 'string' && countryCode.trim()) {
      patch.countryCode = countryCode.trim().toUpperCase();
    }

    const countryName = body.countryName ?? body.country_name;
    if (typeof countryName === 'string' && countryName.trim()) {
      patch.countryName = countryName.trim();
    }

    const minWage = body.minimumWage ?? body.minimum_wage;
    if (minWage !== undefined) {
      const wage = Number(minWage);
      if (!Number.isFinite(wage) || wage < 0) {
        throw new AppError('Minimum wage must be a non-negative number.', {
          statusCode: 400,
          errorKey: 'compliance.invalidWage',
        });
      }
      patch.minimumWage = wage;
    }

    if (typeof body.currency === 'string' && body.currency.trim()) {
      patch.currency = body.currency.trim().toUpperCase();
    }

    if (body.notes !== undefined) {
      patch.notes = typeof body.notes === 'string' ? body.notes : undefined;
    }

    const updatedConfig = complianceRepository.updateLegalComplianceConfig(patch);
    const audit = auditService.getFullAuditSummary();

    res.status(200).json({
      ok: true,
      data: {
        ...audit,
        compliance: updatedConfig,
        audit,
      },
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * GET /api/compliance/countries
   * Lists statutory reference countries preloaded in SQLite.
   */
  getReferenceCountries = (_req: Request, res: Response): void => {
    const countries = complianceRepository.getReferenceCountries();
    res.status(200).json({
      ok: true,
      data: countries,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * PUT /api/compliance/countries/:code
   * Allows customizing the default minimum wage for a specific reference country.
   */
  updateReferenceCountry = (req: Request, res: Response): void => {
    const code = String(req.params.code || '').trim().toUpperCase();
    const existing = complianceRepository.getReferenceCountryByCode(code);

    if (!existing) {
      throw new AppError(`Reference country "${code}" not found.`, {
        statusCode: 404,
        errorKey: 'compliance.countryNotFound',
      });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const defaultMinimumWage =
      body.defaultMinimumWage !== undefined ? Number(body.defaultMinimumWage) : existing.defaultMinimumWage;

    if (!Number.isFinite(defaultMinimumWage) || defaultMinimumWage < 0) {
      throw new AppError('Statutory minimum wage must be a non-negative number.', {
        statusCode: 400,
        errorKey: 'compliance.invalidWage',
      });
    }

    const updated = complianceRepository.upsertReferenceCountry({
      ...existing,
      defaultMinimumWage,
      notes: typeof body.notes === 'string' ? body.notes : existing.notes,
    });

    res.status(200).json({
      ok: true,
      data: updated,
      timestamp: new Date().toISOString(),
    });
  };
}

export const complianceController = new ComplianceController();
