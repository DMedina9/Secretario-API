import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../common/database.mjs';
import { initDb } from '../common/models/Secretario.mjs';
import { broadcast } from '../common/socket.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../storage/data.db');

export const downloadBackup = async (res) => {
    try {
        return res.download(DB_PATH, `backup-${Date.now()}.db`);
    } catch (err) {
        throw new Error('Error al descargar el respaldo: ' + err.message);
    }
};

export const restoreBackup = async (file) => {
    if (!file || !file.buffer) throw new Error('No se recibió archivo');

    try {
        // Notify clients that restore is starting
        try { broadcast({ status: 'restore_started' }, 'backup'); } catch (e) {}

        // Close sequelize connection before replacing file
        try {
            await sequelize.close();
        } catch (e) {
            // ignore
        }

        // Overwrite DB file
        await fs.writeFile(DB_PATH, file.buffer);

        // Re-initialize DB (reconnect and sync)
        await initDb();

        try { broadcast({ status: 'restore_success' }, 'backup'); } catch (e) {}

        return { success: true };
    } catch (err) {
        try { broadcast({ status: 'restore_error', error: err.message }, 'backup'); } catch (e) {}
        throw new Error('Error al restaurar respaldo: ' + err.message);
    }
};
