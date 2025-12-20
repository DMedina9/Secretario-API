import { Asistencias, sequelize } from '../common/models/Secretario.mjs'
import { QueryTypes } from 'sequelize'
import xlsx from 'xlsx'

const getAsistencia = async (req, res) => {
    const asistencia = await Asistencias.findByPk(req.params.id);
    if (!asistencia) return res.status(404).json({ error: 'Asistencia not found' });
    res.json({ success: true, data: asistencia });
};

// =====================================================================================
// OBTENER ASISTENCIAS (RAW)
// =====================================================================================
const getAllAsistencias = async (req, res) => {
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
const addAsistencia = async (req, res) => {
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
const updateAsistencia = async (req, res) => {
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
const deleteAsistencia = async (req, res) => {
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
const uploadAsistencias = async (req, res) => {
    try {
        for (const a of req.body) {
            await Asistencias.upsert({
                fecha: a.Fecha || null,
                asistentes: a.Asistentes || null,
                notas: a.Notas || null
            })
        }
        res.json({ success: true, data: req.body })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// IMPORTAR ASISTENCIAS
// =====================================================================================
const importAsistencia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo no recibido' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheet = workbook.Sheets['Asistencias'];
        if (!sheet) {
            return res.status(400).json({
                success: false,
                message: 'No se encontró la hoja "Asistencias"'
            });
        }

        const jsonAsistencias = xlsx.utils.sheet_to_json(sheet, {
            defval: null
        });
        for (const a of jsonAsistencias) {
            let fecha
            try {
                const fechaObj = new Date(a.Fecha)
                if (isNaN(fechaObj)) continue
                fecha = fechaObj.toISOString().substring(0, 10)
            } catch {
                continue
            }
            await Asistencias.upsert({
                fecha,
                asistentes: a.Asistentes,
                notas: a.Notas
            });
        }

        res.json({ success: true, data: jsonAsistencias });

    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
};

export default {
    getAsistencia,
    getAllAsistencias,
    addAsistencia,
    updateAsistencia,
    deleteAsistencia,
    uploadAsistencias,
    importAsistencia
};