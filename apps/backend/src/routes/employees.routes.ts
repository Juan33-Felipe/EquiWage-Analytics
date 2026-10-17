import { Router } from 'express';
import { employeesController } from '../controllers/employees.controller.js';

export const employeesRouter = Router();

employeesRouter.get('/', employeesController.listEmployees);
employeesRouter.post('/', employeesController.upsertEmployee);
