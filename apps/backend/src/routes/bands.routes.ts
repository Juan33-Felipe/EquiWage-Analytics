import { Router } from 'express';
import { bandsController } from '../controllers/bands.controller.js';

export const bandsRouter = Router();

bandsRouter.get('/', bandsController.listBands);
bandsRouter.post('/', bandsController.addBand);
bandsRouter.put('/', bandsController.replaceBands);
bandsRouter.patch('/:level', bandsController.updateBand);
