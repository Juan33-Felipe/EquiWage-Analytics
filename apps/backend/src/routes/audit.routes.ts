import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.js';

export const auditRouter = Router();

auditRouter.get('/', auditController.getFullAudit);
auditRouter.get('/gaps', auditController.getMarketGaps);
auditRouter.get('/inequities', auditController.getInternalInequities);
auditRouter.get('/distribution', auditController.getDistribution);
