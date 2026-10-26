import { Router } from 'express';
import { simulationController } from '../controllers/simulation.controller.js';

export const simulationRouter = Router();

simulationRouter.get('/', simulationController.getSimulation);
simulationRouter.patch('/', simulationController.updateSimulation);
simulationRouter.post('/preview', simulationController.previewSimulation);
simulationRouter.post('/simulate', simulationController.previewSimulation);
simulationRouter.post('/calculate', simulationController.previewSimulation);
simulationRouter.post('/apply', simulationController.applySimulation);
simulationRouter.post('/approve-plan', simulationController.approvePayrollPlan);

// Manual Micro-Adjustments (Feature B)
simulationRouter.get('/manual-adjustments', simulationController.listManualAdjustments);
simulationRouter.post('/manual-adjustments', simulationController.upsertManualAdjustment);
simulationRouter.delete('/manual-adjustments', simulationController.clearManualAdjustments);
simulationRouter.delete('/manual-adjustments/:employeeId', simulationController.deleteManualAdjustment);

