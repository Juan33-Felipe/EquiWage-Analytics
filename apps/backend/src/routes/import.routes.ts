import { Router } from 'express';
import { importController } from '../controllers/import.controller.js';
import { uploadFileMiddleware } from '../middlewares/upload.middleware.js';

export const importRouter = Router();

importRouter.post(
  '/payroll',
  uploadFileMiddleware.single('file'),
  importController.importPayroll
);

importRouter.post(
  '/bands',
  uploadFileMiddleware.single('file'),
  importController.importBands
);
