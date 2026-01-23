import express from 'express';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import * as FillPDFController from './controller.mjs';

const router = express.Router();

// Get S21 report
router.post('/get-s21-totales', check, async (req, res) => {
    try {
        const { anio, id_tipo_publicador } = req.body;
        const result = await FillPDFController.getS21Totales(anio, id_tipo_publicador);
        if (!result.success) return res.json(result);
        if (result.zip) {
            const zipBytes = result.zip.toBuffer();
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="' + result.fileName + '"',
                'Content-Length': zipBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(zipBytes);
        }
        else {
            const pdfBytes = result.bytes;
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="' + result.fileName + '"',
                'Content-Length': pdfBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(pdfBytes);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get S21 report
router.post('/get-s21', check, async (req, res) => {
    try {
        const { anio, id_publicador } = req.body;
        const result = await FillPDFController.getS21(anio, id_publicador);
        if (!result.success) return res.json(result);
        if (result.zip) {
            const zipBytes = result.zip.toBuffer();
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="' + result.fileName + '"',
                'Content-Length': zipBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(zipBytes);
        }
        else {
            const pdfBytes = result.bytes;
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="' + result.fileName + '"',
                'Content-Length': pdfBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(pdfBytes);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get privilegios
router.get('/get-s88/:anio', check, async (req, res) => {
    try {
        const { anio } = req.params;
        const result = await FillPDFController.getS88(anio);
        if (!result.success) return res.json(result);
        if (result.zip) {
            const zipBytes = result.zip.toBuffer();
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="' + result.fileName.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U') + '"',
                'Content-Length': zipBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(zipBytes);
        }
        else {
            const pdfBytes = result.bytes;
            // Configurar la respuesta HTTP para la descarga
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="' + result.fileName.replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U') + '"',
                'Content-Length': pdfBytes.length
            });

            // Enviar el Buffer como la respuesta
            res.send(pdfBytes);
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

export default router;
