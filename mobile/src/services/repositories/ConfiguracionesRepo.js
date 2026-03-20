import { getDb } from '../Database';

export const getConfigByClave = async (clave) => {
    const db = await getDb();
    return await db.getFirstAsync('SELECT * FROM configuraciones WHERE clave = ?', [clave]);
};

export const getAllConfiguraciones = async () => {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM configuraciones');
};
