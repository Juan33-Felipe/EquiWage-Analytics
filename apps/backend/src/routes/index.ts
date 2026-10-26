import { Router } from 'express';
import { requireAuthMiddleware } from '../middlewares/auth.middleware.js';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { auditRouter } from './audit.routes.js';
import { employeesRouter } from './employees.routes.js';
import { bandsRouter } from './bands.routes.js';
import { simulationRouter } from './simulation.routes.js';
import { complianceRouter } from './compliance.routes.js';
import { importRouter } from './import.routes.js';
import { sessionRouter } from './session.routes.js';
import { reportsRouter } from './reports.routes.js';
import { aiRouter } from './ai.routes.js';

export const apiRouter = Router();

// Public routes (Health diagnostics & Local Authentication)
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);

// Protected compensation & payroll routes (RNF-001 Local Access Control)
apiRouter.use('/audit', requireAuthMiddleware, auditRouter);
apiRouter.use('/employees', requireAuthMiddleware, employeesRouter);
apiRouter.use('/bands', requireAuthMiddleware, bandsRouter);
apiRouter.use('/simulation', requireAuthMiddleware, simulationRouter);
apiRouter.use('/simulator', requireAuthMiddleware, simulationRouter);
apiRouter.use('/compliance', requireAuthMiddleware, complianceRouter);
apiRouter.use('/import', requireAuthMiddleware, importRouter);
apiRouter.use('/session', requireAuthMiddleware, sessionRouter);
apiRouter.use('/reports', requireAuthMiddleware, reportsRouter);
apiRouter.use('/ai', requireAuthMiddleware, aiRouter);
