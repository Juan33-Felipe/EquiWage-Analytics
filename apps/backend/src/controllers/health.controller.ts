import type { Request, Response } from 'express';
import { APP_NAME, type HealthCheckResponse } from '@equiwage/shared';
import { envConfig } from '../config/env.config.js';
import {
  bandsRepository,
  employeesRepository,
  settingsRepository,
  snapshotsRepository,
} from '../repositories/index.js';

export class HealthController {
  /**
   * GET /api/health
   * Standard healthcheck endpoint reporting server, SQLite database, and AI module status.
   */
  getHealth = (_req: Request, res: Response): void => {
    const employeeCount = employeesRepository.count();
    const bandCount = bandsRepository.count();
    const payrollSource = settingsRepository.getPayrollSource();

    const payload: HealthCheckResponse = {
      ok: true,
      service: `${APP_NAME} Backend API`,
      version: '1.0.0',
      database: {
        connected: true,
        engine: 'sqlite',
        employeeCount,
        bandCount,
        payrollSource,
      },
      ai: {
        configured: envConfig.ai.isConfigured,
        provider: envConfig.ai.provider,
        anonymizationEnabled: true,
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(payload);
  };

  /**
   * GET /api/health/db
   * Detailed SQLite database diagnostic endpoint verifying seeded tables, bands, and payroll records.
   */
  getDatabaseDiagnostics = (_req: Request, res: Response): void => {
    const bands = bandsRepository.findAll();
    const employees = employeesRepository.findAll();
    const simulation = settingsRepository.getSimulationParams();
    const payrollSource = settingsRepository.getPayrollSource();
    const seededAt = settingsRepository.getMetadata('seeded_at');
    const snapshotCount = snapshotsRepository.count();

    const departmentCounts = employees.reduce<Record<string, number>>((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      ok: true,
      database: {
        engine: 'sqlite (node:sqlite WAL mode)',
        filePath: envConfig.sqliteDbPath,
        seededAt,
        payrollSource,
        tables: {
          salary_bands: bands.length,
          employees: employees.length,
          simulation_settings: 1,
          audit_snapshots: snapshotCount,
        },
        departmentBreakdown: departmentCounts,
        activeSimulationSettings: simulation,
        salaryBandsPreview: bands,
        employeesSamplePreview: employees.slice(0, 5),
      },
      timestamp: new Date().toISOString(),
    });
  };
}

export const healthController = new HealthController();
