import { Asistencias, sequelize } from '../common/models/Secretario.mjs'
import { QueryTypes } from 'sequelize'

export const getAsistencia = async (req, res) => {
    const asistencia = await Asistencias.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: 'Asistencia not found' });
    res.json({ success: true, data: asistencia });
};

// =====================================================================================
// OBTENER ASISTENCIAS (RAW)
// =====================================================================================
export const getAllAsistencias = async (req, res) => {
    try {
        const rows = await sequelize.query(
            `SELECT *,
             CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (6,0)
             THEN 'Fin de semana' ELSE 'Entresemana' END AS tipo_asistencia
             FROM Asistencias
             ORDER BY fecha DESC`,
            { type: QueryTypes.SELECT }
        )
        res.json({ success: true, data: rows })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// AGREGAR ASISTENCIA
// =====================================================================================
export const addAsistencia = async (req, res) => {
    try {
        const item = await Asistencias.create(req.body)
        res.json({ success: true, id: item.id })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ACTUALIZAR ASISTENCIA
// =====================================================================================
export const updateAsistencia = async (req, res) => {
    try {
        const result = await Asistencias.update(
            req.body,
            { where: { id: req.params.id } }
        )
        res.json({ success: true, changes: result[0] })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ELIMINAR ASISTENCIA
// =====================================================================================
export const deleteAsistencia = async (req, res) => {
    try {
        const result = await Asistencias.destroy({ where: { id: req.params.id } })
        res.json({ success: true, changes: result })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// CARGAR ASISTENCIAS (INSERT OR UPDATE)
// =====================================================================================
export const uploadAsistencias = async (req, res) => {
    try {
        for (const a of req.body) {
            await Asistencias.upsert({
                fecha: a.Fecha,
                asistentes: a.Asistentes,
                notas: a.Notas
            })
        }
        res.json({ success: true, data: req.body })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}
