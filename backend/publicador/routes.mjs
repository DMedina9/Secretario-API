import express from 'express';
import PublicadorController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';
import { upload } from '../common/middlewares/upload.mjs';

const router = express.Router();

router.get('/all', check, has('user'), PublicadorController.getPublicadores);
router.post('/add', check, has('user'), PublicadorController.addPublicador);
router.put('/:id', check, has('user'), PublicadorController.updatePublicador);
router.delete('/:id', check, has('user'), PublicadorController.deletePublicador);
router.get('/export', check, has('user'), PublicadorController.exportPublicadores);
router.get('/grupo/:grupo', check, has('user'), PublicadorController.getPublicadoresByGrupo);
router.post('/import', check, has('user'), upload.single('file'), PublicadorController.importPublicadores);

// Get privilegios
router.get('/privilegios', check, async (req, res) => {
    try {
        const result = await PublicadorController.getPrivilegios();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get tipos de publicador
router.get('/tipos-publicador', check, async (req, res) => {
    try {
        const result = await PublicadorController.getTiposPublicador();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
router.get('/:id', check, PublicadorController.getPublicador);

export default router;