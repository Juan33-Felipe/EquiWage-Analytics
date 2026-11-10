import {
  APP_NAME,
  SESSION_SCHEMA_VERSION,
  validateSessionPayload,
  type AuditSummaryPayload,
  type ProjectSessionPayload,
} from '@equiwage/shared';
import { runInTransaction } from '../database/sqlite.connection.js';
import { resetDatabaseToSeed } from '../database/seed.runner.js';
import { AppError } from '../middlewares/error-handler.middleware.js';
import {
  bandsRepository,
  employeesRepository,
  settingsRepository,
  snapshotsRepository,
} from '../repositories/index.js';
import { auditService } from './audit.service.js';

export class SessionService {
  /**
   * Exports the complete active analysis session into a portable .json project object (RF-008).
   */
  exportProjectSession(userId?: string): ProjectSessionPayload {
    const employees = employeesRepository.findAll({}, userId);
    const bands = bandsRepository.findAll().map(({ level, min, median, max }) => ({
      level,
      min,
      median,
      max,
    }));
    const payrollSource = settingsRepository.getPayrollSource();
    const simulation = settingsRepository.getSimulationParams();

    const payload: ProjectSessionPayload = {
      app: APP_NAME,
      version: SESSION_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      payrollSource,
      employees,
      bands,
      simulation,
    };

    const summary = auditService.getFullAuditSummary(userId);
    snapshotsRepository.createSnapshot({
      name: `Exported session (${payrollSource})`,
      payrollSource,
      headcount: summary.metrics.headcount,
      marketGapsCount: summary.metrics.marketDisparities,
      inequitiesCount: summary.metrics.inequityCount,
      totalBudget: summary.simulationResult.totalBudget,
      payload,
    });

    return payload;
  }

  /**
   * Restores a complete project session from a .json payload into SQLite (RF-008).
   */
  restoreProjectSession(rawPayload: unknown, userId?: string): AuditSummaryPayload {
    const validation = validateSessionPayload(rawPayload);
    if (!validation.ok) {
      throw new AppError(validation.message, {
        statusCode: 400,
        errorKey: validation.errorKey,
      });
    }

    const { session } = validation;

    runInTransaction(() => {
      bandsRepository.replaceAllBands(session.bands);
      employeesRepository.replaceAllEmployees(session.employees, session.payrollSource, userId);
      settingsRepository.updateSimulationParams(session.simulation);
    });

    const restoredAudit = auditService.getFullAuditSummary(userId);

    snapshotsRepository.createSnapshot({
      name: `Restored session (${session.payrollSource})`,
      payrollSource: session.payrollSource,
      headcount: restoredAudit.metrics.headcount,
      marketGapsCount: restoredAudit.metrics.marketDisparities,
      inequitiesCount: restoredAudit.metrics.inequityCount,
      totalBudget: restoredAudit.simulationResult.totalBudget,
      payload: session,
    });

    return restoredAudit;
  }

  /**
   * Resets the local SQLite database back to the initial realistic seed dataset.
   */
  resetProjectSession(userId?: string): AuditSummaryPayload {
    if (userId && userId !== 'USR-ADMIN-001') {
      employeesRepository.loadDemoEmployees(userId);
      return auditService.getFullAuditSummary(userId);
    }
    resetDatabaseToSeed();
    return auditService.getFullAuditSummary(userId);
  }

  /**
   * Lists recent audit/scenario snapshots stored in SQLite.
   */
  listSnapshots(limit = 20) {
    return snapshotsRepository.findRecentSnapshots(limit);
  }
}

export const sessionService = new SessionService();
