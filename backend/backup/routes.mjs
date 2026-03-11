import express from 'express';
import multer from 'multer';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import * as BackupController from './controller.mjs';
// Socket.IO used for notifications; no SSE handler required

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/download', check, async (req, res) => {
    try {
        await BackupController.downloadBackup(res);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/restore', check, upload.single('backup'), async (req, res) => {
    try {
        const result = await BackupController.restoreBackup(req.file);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Notifications are delivered via Socket.IO; no HTTP events endpoint

export default router;
