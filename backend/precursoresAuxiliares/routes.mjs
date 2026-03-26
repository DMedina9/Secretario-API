import express from 'express';
import PrecursoresAuxiliaresController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';

const router = express.Router();

// Exportar (antes de rutas con parámetros para evitar conflictos)
router.get('/export', check, has('admin'), PrecursoresAuxiliaresController.exportPrecursoresAuxiliares);

// Bulk upsert / sync
router.post('/bulk', check, has('admin'), PrecursoresAuxiliaresController.upsertPrecursoresBulk);
router.post('/sync', check, has('admin'), PrecursoresAuxiliaresController.syncPrecursoresAuxiliaresMonth);

// CRUD básico
router.post('/add', check, has('admin'), PrecursoresAuxiliaresController.addPrecursorAuxiliar);
router.put('/:id', check, has('admin'), PrecursoresAuxiliaresController.updatePrecursorAuxiliar);
router.delete('/:id', check, has('admin'), PrecursoresAuxiliaresController.deletePrecursorAuxiliar);

// Consultas por publicador o por año de servicio
router.get('/publicador/:id_publicador', check, PrecursoresAuxiliaresController.getPrecursoresByPublicador);
router.get('/:anio_servicio', check, PrecursoresAuxiliaresController.getPrecursoresAuxiliares);
router.get('/:anio_servicio/:mes', check, PrecursoresAuxiliaresController.getPrecursoresAuxiliares);

export default router;
