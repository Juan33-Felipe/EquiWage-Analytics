import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { auditRouter } from './audit.routes.js';
import { employeesRouter } from './employees.routes.js';
import { bandsRouter } from './bands.routes.js';
import { simulationRouter } from './simulation.routes.js';
import { importRouter } from './import.routes.js';
import { sessionRouter } from './session.routes.js';
import { reportsRouter } from './reports.routes.js';
import { aiRouter } from './ai.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/bands', bandsRouter);
apiRouter.use('/simulation', simulationRouter);
apiRouter.use('/import', importRouter);
apiRouter.use('/session', sessionRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/ai', aiRouter);
