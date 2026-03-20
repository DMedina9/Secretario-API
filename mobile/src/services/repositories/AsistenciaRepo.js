import { getDb } from '../Database';

export const getAllAsistencias = async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM asistencias ORDER BY fecha DESC');
};
