import { getDb } from '../Database';

export const getAllPublicadores = async () => {
    const db = await getDb();
    const rows = await db.getAllAsync('SELECT * FROM publicadores ORDER BY nombre, apellidos');
    return rows;
};

export const getPublicadorById = async (id) => {
    const db = await getDb();
    return await db.getFirstAsync('SELECT * FROM publicadores WHERE id = ?', [id]);
};

export const getTiposPublicador = async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM tipos_publicador');
};
