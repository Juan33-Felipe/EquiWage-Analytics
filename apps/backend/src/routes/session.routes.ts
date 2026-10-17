import { Router } from 'express';
import { sessionController } from '../controllers/session.controller.js';
import { uploadFileMiddleware } from '../middlewares/upload.middleware.js';

export const sessionRouter = Router();

sessionRouter.get('/export', sessionController.exportSession);
sessionRouter.post(
  '/restore',
  uploadFileMiddleware.single('file'),
  sessionController.restoreSession
);
sessionRouter.post('/reset', sessionController.resetSession);
sessionRouter.get('/snapshots', sessionController.listSnapshots);
