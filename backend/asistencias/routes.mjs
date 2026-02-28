import express from 'express';
import AsistenciasController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';
import { upload } from '../common/middlewares/upload.mjs';

const router = express.Router();

router.get('/all', check, has('user'), AsistenciasController.getAllAsistencias);
router.get('/export', check, has('user'), AsistenciasController.exportAsistencias);
router.get('/:id', check, has('user'), AsistenciasController.getAsistencia);
router.post('/import', check, has('user'), upload.single('file'), AsistenciasController.importAsistencia);
router.post('/add', check, has('user'), AsistenciasController.addAsistencia);
router.put('/:id', check, has('user'), AsistenciasController.updateAsistencia);
router.delete('/maintenance/old', check, has('user'), AsistenciasController.deleteOldAsistencias);
router.delete('/:id', check, has('user'), AsistenciasController.deleteAsistencia);

export default router;