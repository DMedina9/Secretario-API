import express from 'express';
import PublicadorController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';

const router = express.Router();

router.get('/:id', check, PublicadorController.getPublicador);
router.get('/all', check, has('admin'), PublicadorController.getAllPublicadores);
router.post('/add', check, has('admin'), PublicadorController.addPublicador);
router.put('/:id', check, has('admin'), PublicadorController.updatePublicador);
router.delete('/:id', check, has('admin'), PublicadorController.deletePublicador);

export default router;