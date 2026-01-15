import express from 'express';
import AsistenciasController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';
import { upload } from '../common/middlewares/upload.mjs';

const router = express.Router();

router.get('/all', check, has('admin'), AsistenciasController.getAllAsistencias);
router.get('/export', check, has('admin'), AsistenciasController.exportAsistencias);
router.get('/:id', check, AsistenciasController.getAsistencia);
router.post('/import', check, has('admin'), upload.single('file'), AsistenciasController.importAsistencia);
router.post('/add', check, has('admin'), AsistenciasController.addAsistencia);
router.put('/:id', check, has('admin'), AsistenciasController.updateAsistencia);
router.delete('/:id', check, has('admin'), AsistenciasController.deleteAsistencia);

export default router;