import { Publicadores, sequelize } from '../common/models/Secretario.mjs';
import { QueryTypes } from 'sequelize'

// =====================================================================================
// OBTENER PUBLICADOR
// =====================================================================================
export const getPublicador = async (req, res) => {
    const publicador = await Publicadores.findByPk(req.params.id);
    if (!publicador) return res.status(404).json({ error: 'Publicador not found' });
    res.json({ success: true, data: publicador });
};

// =====================================================================================
// OBTENER PUBLICADORES
// =====================================================================================
export const getAllPublicadores = async (req, res) => {
    const publicadores = await Publicadores.findAll();
    res.json({ success: true, data: publicadores });
};
// =====================================================================================
// OBTENER PUBLICADORES (RAW por el CASE)
// =====================================================================================
export const getPublicadores = async (req, res) => {
    try {
        const rows = await sequelize.query(`
            SELECT
                p.*,
                CASE sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' END AS sup_grupo_desc,
                pr.descripcion AS privilegio,
                tp.descripcion AS tipo_publicador
            FROM Publicadores p
            LEFT JOIN Privilegio pr ON pr.id = p.id_privilegio
            LEFT JOIN Tipo_Publicador tp ON tp.id = p.id_tipo_publicador
            ORDER BY grupo, apellidos, nombre
        `, { type: QueryTypes.SELECT })

        res.json({ success: true, data: rows })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// AGREGAR PUBLICADOR
// =====================================================================================
export const addPublicador = async (req, res) => {
    try {
        const item = await Publicadores.create(req.body)
        res.json({ success: true, lastID: item.id })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ACTUALIZAR PUBLICADOR
// =====================================================================================
export const updatePublicador = async (req, res) => {
    try {
        const result = await Publicadores.update(
            req.body,
            { where: { id: req.params.id } }
        )
        res.json({ success: true, changes: result[0] })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ELIMINAR PUBLICADOR + SUS INFORMES
// =====================================================================================
export const deletePublicador = async (req, res) => {
    try {
        await Informes.destroy({ where: { id_publicador: req.params.id } })
        const result = await Publicadores.destroy({ where: { id: req.params.id } })
        res.json({ success: true, changes: result })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}
