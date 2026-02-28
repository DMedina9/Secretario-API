// territorios/controller.mjs
import { Configuracion } from '../common/models/Secretario.mjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KML_FILE_PATH = path.join(__dirname, '../uploads/territorios.kml');

// =====================================================================================
// UPLOAD KML
// =====================================================================================
export const uploadKML = async (file) => {
    try {
        if (!file) {
            return { success: false, error: 'No se proporcionó ningún archivo' };
        }

        // Validate file extension
        if (!file.originalname.toLowerCase().endsWith('.kml')) {
            return { success: false, error: 'Solo se permiten archivos .kml' };
        }

        // Save file to uploads folder
        await fs.writeFile(KML_FILE_PATH, file.buffer);

        return { success: true, message: 'Archivo KML subido exitosamente' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// GET KML
// =====================================================================================
export const getKML = async () => {
    try {
        const fileExists = await checkKMLExists();
        if (!fileExists) {
            return { success: false, error: 'No hay archivo KML disponible' };
        }

        const content = await fs.readFile(KML_FILE_PATH, 'utf-8');
        return { success: true, data: content };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// CHECK KML EXISTS
// =====================================================================================
export const checkKMLExists = async () => {
    try {
        await fs.access(KML_FILE_PATH);
        return true;
    } catch {
        return false;
    }
};
