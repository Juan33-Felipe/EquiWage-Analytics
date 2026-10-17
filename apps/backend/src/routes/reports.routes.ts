import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

reportsRouter.post('/executive', reportsController.generateExecutiveReport);
