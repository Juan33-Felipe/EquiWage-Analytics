import { Router } from 'express';
import { employeesController } from '../controllers/employees.controller.js';
import { importController } from '../controllers/import.controller.js';
import { uploadFileMiddleware } from '../middlewares/upload.middleware.js';

export const employeesRouter = Router();

employeesRouter.get('/', employeesController.listEmployees);
employeesRouter.post('/import', uploadFileMiddleware.single('file'), importController.importPayroll);
employeesRouter.get('/:id', employeesController.getEmployeeById);
employeesRouter.post('/', employeesController.createEmployee);
employeesRouter.put('/:id', employeesController.updateEmployee);
employeesRouter.delete('/:id', employeesController.deleteEmployee);
