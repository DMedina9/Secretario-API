import { PrecursoresAuxiliares, Publicadores, sequelize } from '../common/models/Secretario.mjs';
import { QueryTypes } from 'sequelize';
import { handleExport } from '../common/utils/ExportHelper.mjs';

// =====================================================================================
// OBTENER PRECURSORES AUXILIARES
// Filtra por anio_servicio y/o mes si se proporcionan como parámetros
// =====================================================================================
const getPrecursoresAuxiliares = async (req, res) => {
    try {
        const { anio_servicio, mes } = req.params;

        const rows = await sequelize.query(`
            SELECT pa.*,
                p.nombre || ' ' || p.apellidos AS publicador,
                p.grupo,
                (CAST(STRFTIME('%m', pa.mes) AS INTEGER) + 3) % 12 + 1 AS iNumMes
            FROM PrecursoresAuxiliares pa
            LEFT JOIN Publicadores p ON pa.id_publicador = p.id
            WHERE 1 = 1
            ${anio_servicio
                ? `AND (CASE WHEN CAST(STRFTIME('%m', pa.mes) AS INTEGER) > 8 THEN 1 ELSE 0 END + CAST(STRFTIME('%Y', pa.mes) AS INTEGER)) = ${anio_servicio}`
                : ''}
            ${mes ? `AND CAST(STRFTIME('%m', pa.mes) AS INTEGER) = ${mes}` : ''}
            ORDER BY pa.mes ASC, p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT });

        res.json({ success: true, data: rows });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

// =====================================================================================
// OBTENER PRECURSORES AUXILIARES POR PUBLICADOR
// =====================================================================================
const getPrecursoresByPublicador = async (req, res) => {
    try {
        const { id_publicador } = req.params;
        const rows = await PrecursoresAuxiliares.findAll({
            where: { id_publicador },
            order: [['mes', 'DESC']]
        });
        res.json({ success: true, data: rows });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

// =====================================================================================
// AGREGAR PRECURSOR AUXILIAR
// =====================================================================================
const addPrecursorAuxiliar = async (req, res) => {
    try {
        const item = await PrecursoresAuxiliares.create(req.body);
        res.json({ success: true, id: item.id });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

// =====================================================================================
// ACTUALIZAR PRECURSOR AUXILIAR
// =====================================================================================
const updatePrecursorAuxiliar = async (req, res) => {
    try {
        const result = await PrecursoresAuxiliares.update(
            req.body,
            { where: { id: req.params.id } }
        );
        res.json({ success: true, changes: result[0] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

// =====================================================================================
// ELIMINAR PRECURSOR AUXILIAR
// =====================================================================================
const deletePrecursorAuxiliar = async (req, res) => {
    try {
        const result = await PrecursoresAuxiliares.destroy({ where: { id: req.params.id } });
        res.json({ success: true, changes: result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

// =====================================================================================
// UPSERT EN MASA (BULK) - agrega o actualiza múltiples registros
// =====================================================================================
const upsertPrecursoresBulk = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const data = req.body;
        if (!Array.isArray(data) || data.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'El cuerpo de la solicitud debe ser un array no vacío.'
            });
        }

        const results = [];
        for (const item of data) {
            const { id_publicador, mes, ...updateFields } = item;
            if (!id_publicador || !mes) {
                await transaction.rollback();
                throw new Error('Cada registro debe tener id_publicador y mes.');
            }

            const [record, created] = await PrecursoresAuxiliares.findOrCreate({
                where: { id_publicador, mes },
                defaults: item,
                transaction
            });

            if (!created) {
                await record.update(updateFields, { transaction });
            }
            results.push({ id: record.id, created });
        }

        await transaction.commit();
        res.json({ success: true, results });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// =====================================================================================
// SINCRONIZAR MES (bulk sync)
// =====================================================================================
const syncPrecursoresAuxiliaresMonth = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { mes, id_publicadores } = req.body;

        if (!mes || !Array.isArray(id_publicadores)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                error: 'Se requiere mes e id_publicadores (array).'
            });
        }

        // 1. Obtener los actuales
        const actuales = await PrecursoresAuxiliares.findAll({
            where: { mes },
            transaction
        });

        const actualesIds = actuales.map(a => a.id_publicador);

        // 2. Eliminar los que no están en la nueva lista
        const aEliminar = actuales.filter(a => !id_publicadores.includes(a.id_publicador));
        for (const record of aEliminar) {
            await record.destroy({ transaction });
        }

        // 3. Agregar los nuevos
        const aAgregar = id_publicadores.filter(id => !actualesIds.includes(id));
        for (const id_pub of aAgregar) {
            await PrecursoresAuxiliares.create({
                id_publicador: id_pub,
                mes,
                notas: '' // Default vacío en sync
            }, { transaction });
        }

        await transaction.commit();
        res.json({ success: true });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        res.status(500).json({ success: false, error: error.message });
    }
};

// =====================================================================================
// EXPORTAR PRECURSORES AUXILIARES
// =====================================================================================
const exportPrecursoresAuxiliares = async (req, res) => {
    try {
        const { format = 'xlsx' } = req.query;
        const rows = await sequelize.query(`
            SELECT
                p.nombre || ' ' || p.apellidos AS Nombre,
                pa.mes AS Mes,
                pa.notas AS Notas
            FROM PrecursoresAuxiliares pa
            LEFT JOIN Publicadores p ON pa.id_publicador = p.id
            ORDER BY pa.mes DESC, p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT });

        handleExport(res, rows, format, 'PrecursoresAuxiliares');
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getPrecursoresAuxiliares,
    getPrecursoresByPublicador,
    addPrecursorAuxiliar,
    updatePrecursorAuxiliar,
    deletePrecursorAuxiliar,
    upsertPrecursoresBulk,
    syncPrecursoresAuxiliaresMonth,
    exportPrecursoresAuxiliares
};
