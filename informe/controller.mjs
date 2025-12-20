import { Publicadores, Informes, sequelize } from '../common/models/Secretario.mjs';
import { QueryTypes } from 'sequelize'
import xlsx from 'xlsx'
// =====================================================================================
// OBTENER INFORMES (RAW) - consulta compleja
// =====================================================================================
const getInformes = async (req, res) => {
    try {
        const id_publicador = req.params.id_publicador;
        const anio_servicio = req.params.anio_servicio;
        const mes = req.params.mes;
        const rows = await sequelize.query(`
            SELECT i.*,
                p.nombre || ' ' || p.apellidos AS publicador,
                tp.descripcion AS tipo_publicador,
                (CAST(STRFTIME('%m', mes) AS INTEGER) + 3) % 12 + 1 AS iNumMes,
                CASE WHEN tp.descripcion = 'Precursor regular'
                     THEN MAX(0, MIN(55 - horas, IFNULL(horas_SS, 0)))
                     ELSE NULL END AS horas_Acred,
                CASE WHEN (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = i.id_publicador
                      AND DATE(a.mes) BETWEEN DATE(i.mes, '-6 months')
                      AND DATE(i.mes, '-1 months')
                ) > 0 THEN 'Activo' ELSE 'Inactivo' END AS EstatusAnterior,
                CASE WHEN (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = i.id_publicador
                      AND DATE(a.mes) BETWEEN DATE(i.mes, '-5 months')
                      AND DATE(i.mes)
                ) > 0 THEN 'Activo' ELSE 'Inactivo' END AS Estatus
            FROM Informes i
            LEFT JOIN Publicadores p ON i.id_publicador = p.id
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            WHERE 1 = 1
            ${anio_servicio ? `AND (CASE WHEN CAST(STRFTIME('%m', i.mes) AS INTEGER) > 8 THEN 1 ELSE 0 END + CAST(STRFTIME('%Y', i.mes) AS INTEGER)) = ${anio_servicio}` : ''}
            ${id_publicador ? `AND p.id = ${id_publicador}` : ''}
            ${mes ? `AND CAST(STRFTIME('%m', i.mes) AS INTEGER) = ${mes}` : ''}
            ORDER BY i.mes DESC, p.apellidos, p.nombre
            `,
            { type: QueryTypes.SELECT }
        )

        res.json({ success: true, data: rows })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

const importInformes = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo no recibido' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheet = workbook.Sheets['Informes'];
        if (!sheet) {
            return res.json({
                success: false,
                message: 'No se encontró la hoja "Informes"'
            });
        }

        const jsonInformes = xlsx.utils.sheet_to_json(sheet, {
            defval: null
        });
        const publicadores = await Publicadores.findAll()
        // Importar informes
        for (let p of jsonInformes) {
            let publicador = publicadores.find(
                (pub) => (pub.apellidos ? pub.apellidos + ', ' : '') + pub.nombre == p.Nombre
            )
            if (!publicador) continue
            if (p.Nombre === 'Total') continue
            const id_tipo_publicador = p['Tipo Publicador'] === 'Publicador'
                ? 1
                : p['Tipo Publicador'] === 'Precursor regular'
                    ? 2
                    : 3;
            const mes = p.Mes instanceof Date ? p.Mes.toISOString().substring(0, 10) : null;
            const mes_enviado = p['Mes enviado'] instanceof Date
                ? p['Mes enviado'].toISOString().substring(0, 10)
                : null;
            const predico_en_el_mes = p['Predicó en el mes'] ? 1 : 0;
            const cursos_biblicos = p['Cursos bíblicos'] || null;
            const horas = p.Horas || null;
            const notas = p.Notas || null;
            const horas_SS = p['Horas S. S. (PR)'] || null;
            Informes.upsert({
                id_publicador: publicador.id,
                mes,
                mes_enviado,
                predico_en_el_mes,
                cursos_biblicos,
                id_tipo_publicador,
                horas,
                notas,
                horas_SS
            })
        }
        res.json({ success: true, message: 'Informes importados correctamente', data: jsonInformes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// =====================================================================================
// AGREGAR INFORME
// =====================================================================================
const addInforme = async (req, res) => {
    try {
        const item = await Informes.create(req.body)
        res.json({ success: true, id: item.id })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ACTUALIZAR INFORME
// =====================================================================================
const updateInforme = async (req, res) => {
    try {
        const result = await Informes.update(
            req.body,
            { where: { id: req.params.id } }
        )
        res.json({ success: true, changes: result[0] })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ELIMINAR INFORME
// =====================================================================================
const deleteInforme = async (req, res) => {
    try {
        const result = await Informes.destroy({ where: { id: req.params.id } })
        res.json({ success: true, changes: result })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}
// =====================================================================================
// ACTUALIZAR/AGREGAR INFORMES EN MASA
// =====================================================================================
const upsertInformesBulk = async (req, res) => {
    try {
        const informesData = req.body; // Espera un array de objetos informe
        if (!Array.isArray(informesData) || informesData.length === 0) {
            return res.status(400).json({ success: false, error: 'El cuerpo de la solicitud debe ser un array no vacío de objetos informe.' });
        }

        const results = await Promise.all(informesData.map(async (informe) => {
            const { id_publicador, mes, ...updateFields } = informe;
            if (!id_publicador || !mes) {
                throw new Error('Cada informe debe tener id_publicador y mes.');
            }

            const [record, created] = await Informes.findOrCreate({
                where: { id_publicador, mes },
                defaults: informe,
            });

            if (!created) {
                // Si el registro ya existía, actualízalo
                await record.update(updateFields);
            }
            return { id: record.id, created: created };
        }));

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getInformes,
    addInforme,
    importInformes,
    updateInforme,
    deleteInforme,
    upsertInformesBulk
};