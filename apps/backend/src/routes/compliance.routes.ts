import { Router } from 'express';
import { complianceController } from '../controllers/compliance.controller.js';

export const complianceRouter = Router();

complianceRouter.get('/minimum-wage', complianceController.getMinimumWageConfig);
complianceRouter.put('/minimum-wage', complianceController.updateMinimumWageConfig);
complianceRouter.get('/countries', complianceController.getReferenceCountries);
complianceRouter.put('/countries/:code', complianceController.updateReferenceCountry);
