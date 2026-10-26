import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';

export const aiRouter = Router();

aiRouter.get('/status', aiController.getStatus);
aiRouter.get('/anonymized-preview', aiController.getAnonymizedPreview);
aiRouter.post('/diagnostics', aiController.generateDiagnostics);
aiRouter.post('/diagnostic', aiController.generateDiagnostics);
aiRouter.post('/report', aiController.generateDiagnostics);
aiRouter.post('/ai-report', aiController.generateDiagnostics);
