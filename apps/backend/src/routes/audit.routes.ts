import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';
import { simulationController } from '../controllers/simulation.controller.js';
import { aiController } from '../controllers/ai.controller.js';

export const auditRouter = Router();

auditRouter.get('/', auditController.getFullAudit);
auditRouter.get('/overview', auditController.getFullAudit);
auditRouter.post('/simulate', simulationController.previewSimulation);
auditRouter.get('/gaps', auditController.getMarketGaps);
auditRouter.get('/inequities', auditController.getInternalInequities);
auditRouter.get('/distribution', auditController.getDistribution);
auditRouter.post('/ai-report', aiController.generateDiagnostics);
auditRouter.post('/ai-diagnostic', aiController.generateDiagnostics);
