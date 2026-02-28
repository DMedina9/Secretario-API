// territorios/routes.mjs
import express from 'express';
import multer from 'multer';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import * as TerritoriosController from './controller.mjs';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Upload KML file
router.post('/upload', check, upload.single('kml'), async (req, res) => {
    try {
        const result = await TerritoriosController.uploadKML(req.file);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get KML file
router.get('/kml', check, async (req, res) => {
    try {
        const result = await TerritoriosController.getKML();
        //if (result.success) {
        //    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        //    res.send(result.data);
        //} else {
        res.json(result);
        //}
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Check if KML exists
router.get('/kml/exists', check, async (req, res) => {
    try {
        const exists = await TerritoriosController.checkKMLExists();
        res.json({ success: true, exists });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default router;
