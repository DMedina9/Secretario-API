import express from 'express';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import * as SecretarioController from './controller.mjs';

const router = express.Router();

// Get S1 report
router.get('/s1/:month', check, async (req, res) => {
    try {
        const { month } = req.params;
        const result = await SecretarioController.getS1(month);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get S3 report
router.get('/s3/:anio/:type', check, async (req, res) => {
    try {
        const { anio, type } = req.params;
        const result = await SecretarioController.getS3(anio * 1, type);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get mes informe
router.get('/mes-informe', async (req, res) => {
    try {
        const result = await SecretarioController.getMesInforme();
        res.json({ success: true, data: result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Initialize privilegios
router.post('/init-privilegios', check, async (req, res) => {
    try {
        const result = await SecretarioController.insertPrivilegios();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Initialize tipos de publicador
router.post('/init-tipos', check, async (req, res) => {
    try {
        const result = await SecretarioController.insertTipoPublicador();
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default router;
