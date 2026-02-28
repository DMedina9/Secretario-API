// configuraciones/controller.mjs
import { Configuracion } from '../common/models/Secretario.mjs';

// =====================================================================================
// GET CONFIGURACION
// =====================================================================================
export const getConfiguracion = async (clave) => {
    try {
        const config = await Configuracion.findOne({ where: { clave } });

        if (!config) {
            return { success: true, data: null };
        }

        return { success: true, data: { clave: config.clave, valor: config.valor } };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// UPDATE CONFIGURACION
// =====================================================================================
export const updateConfiguracion = async (clave, valor) => {
    try {
        // Validate valor is a valid number >= 0
        const numValor = parseInt(valor);
        if (isNaN(numValor) || numValor < 0) {
            return { success: false, error: 'El valor debe ser un número mayor o igual a 0' };
        }

        // Upsert configuration
        const [config, created] = await Configuracion.findOrCreate({
            where: { clave },
            defaults: { clave, valor: numValor.toString() }
        });

        if (!created) {
            config.valor = numValor.toString();
            await config.save();
        }

        return {
            success: true,
            message: created ? 'Configuración creada' : 'Configuración actualizada',
            data: { clave: config.clave, valor: config.valor }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// GET ALL CONFIGURACIONES
// =====================================================================================
export const getAllConfiguraciones = async () => {
    try {
        const configs = await Configuracion.findAll({
            order: [['clave', 'ASC']]
        });

        return {
            success: true,
            data: configs.map(c => ({ clave: c.clave, valor: c.valor, tipo: c.tipo }))
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// UPDATE MULTIPLE CONFIGURACIONES
// =====================================================================================
export const updateMultipleConfiguraciones = async (configuraciones) => {
    try {
        if (!Array.isArray(configuraciones)) {
            return { success: false, error: 'Se esperaba un array de configuraciones' };
        }

        // Update each configuration
        for (const config of configuraciones) {
            const { clave, valor } = config;

            if (!clave) {
                continue; // Skip invalid entries
            }

            const [configRecord, created] = await Configuracion.findOrCreate({
                where: { clave },
                defaults: { clave, valor: valor || '' }
            });

            if (!created) {
                configRecord.valor = valor || '';
                await configRecord.save();
            }
        }

        return { success: true, message: 'Configuraciones actualizadas' };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
