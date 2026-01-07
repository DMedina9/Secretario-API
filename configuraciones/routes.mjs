// territorios/routes.mjs
import express from 'express';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import * as ConfiguracionesController from './controller.mjs';

const router = express.Router();

// Get configuration value
router.get('/:clave', check, async (req, res) => {
    try {
        const { clave } = req.params;
        const result = await ConfiguracionesController.getConfiguracion(clave);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get all configurations
router.get('/', check, async (req, res) => {
    try {
        const result = await ConfiguracionesController.getAllConfiguraciones();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Update multiple configurations
router.put('/bulk', check, async (req, res) => {
    try {
        const { configuraciones } = req.body;
        const result = await ConfiguracionesController.updateMultipleConfiguraciones(configuraciones);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Update configuration value
router.put('/:clave', check, async (req, res) => {
    try {
        const { clave } = req.params;
        const { valor } = req.body;
        const result = await ConfiguracionesController.updateConfiguracion(clave, valor);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default router;
