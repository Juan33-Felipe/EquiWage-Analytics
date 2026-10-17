import { Router } from 'express';
import { simulationController } from '../controllers/simulation.controller.js';

export const simulationRouter = Router();

simulationRouter.get('/', simulationController.getSimulation);
simulationRouter.patch('/', simulationController.updateSimulation);
simulationRouter.post('/preview', simulationController.previewSimulation);
simulationRouter.post('/apply', simulationController.applySimulation);
