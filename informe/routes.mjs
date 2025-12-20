import express from 'express';
import InformeController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';
import { upload } from '../common/middlewares/upload.mjs';

const router = express.Router();

router.get('/:id_publicador/:anio_servicio/:mes', check, InformeController.getInformes);
router.post('/add', check, has('admin'), InformeController.addInforme);
router.post('/import', check, has('admin'), upload.single('file'), InformeController.importInformes);
router.put('/:id', check, has('admin'), InformeController.updateInforme);
router.delete('/:id', check, has('admin'), InformeController.deleteInforme);
router.post('/bulk', check, has('admin'), InformeController.upsertInformesBulk);

export default router;