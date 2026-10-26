import { Router } from 'express';
import { bandsController } from '../controllers/bands.controller.js';
import { importController } from '../controllers/import.controller.js';
import { uploadFileMiddleware } from '../middlewares/upload.middleware.js';

export const bandsRouter = Router();

bandsRouter.get('/', bandsController.listBands);
bandsRouter.post('/import', uploadFileMiddleware.single('file'), importController.importBands);
bandsRouter.post('/', bandsController.addBand);
bandsRouter.put('/', bandsController.replaceBands);
bandsRouter.patch('/:level', bandsController.updateBand);
