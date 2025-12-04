import express from 'express';
import InformeController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';

const router = express.Router();

router.get('/:anio_servicio/:id_publicador/:dir', check, InformeController.getInformes);
router.post('/add', check, has('admin'), InformeController.addInforme);
router.put('/:id', check, has('admin'), InformeController.updateInforme);
router.delete('/:id', check, has('admin'), InformeController.deleteInforme);

export default router;