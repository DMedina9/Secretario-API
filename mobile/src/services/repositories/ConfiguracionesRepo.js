import { Configuracion } from '../models';

export const getConfigByClave = async (clave) => {
    const c = await Configuracion.findOne({ where: { clave } });
    return c ? c.toJSON() : null;
};

export const getAllConfiguraciones = async () => {
    return await Configuracion.findAll({ raw: true });
};

export const saveConfiguracion = async (clave, valor) => {
    const c = await Configuracion.findOne({ where: { clave } });
    if (c) {
        return await c.update({ valor, is_dirty: true });
    } else {
        return await Configuracion.create({ clave, valor, is_dirty: true });
    }
};
