import dayjs from 'dayjs';
import { Publicadores, Informes, TipoPublicador, sequelize, Configuracion } from '../common/models/Secretario.mjs';
import { QueryTypes, Op } from 'sequelize'
import xlsx from 'xlsx'
import { sendEmail, createBulkReportEmailHTML } from '../common/services/emailService.mjs';
import { handleExport } from '../common/utils/ExportHelper.mjs';
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
                      AND DATE(a.mes) BETWEEN DATE(i.mes, '-6 months')
                      AND DATE(i.mes)
                ) > 0 THEN 'Activo' ELSE 'Inactivo' END AS Estatus
            FROM Informes i
            LEFT JOIN Publicadores p ON i.id_publicador = p.id
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            WHERE 1 = 1
            ${anio_servicio ? `AND (CASE WHEN CAST(STRFTIME('%m', i.mes) AS INTEGER) > 8 THEN 1 ELSE 0 END + CAST(STRFTIME('%Y', i.mes) AS INTEGER)) = ${anio_servicio}` : ''}
            ${id_publicador ? `AND p.id = ${id_publicador}` : ''}
            ${mes ? `AND CAST(STRFTIME('%m', i.mes) AS INTEGER) = ${mes}` : ''}
            ORDER BY i.mes asc, p.apellidos, p.nombre
            `,
            { type: QueryTypes.SELECT }
        )

        res.json({ success: true, data: rows })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

const getPrecursoresRegulares = async (req, res) => {
    try {
        const anio_servicio = parseInt(req.params.anio_servicio, 10);
        if (!anio_servicio || isNaN(anio_servicio)) {
            return res.status(400).json({ success: false, error: 'Año de servicio inválido' });
        }

        const desde = `${anio_servicio - 1}-09-01`;
        const hasta = `${anio_servicio}-08-01`;

        const rows = await sequelize.query(`
            SELECT
                p.id,
                p.nombre || ' ' || p.apellidos AS publicador,
                MIN(i.mes) AS inicio_precursorado,
                ROUND((julianday('${hasta}') - julianday(MIN(i.mes))) / 365.25, 1) AS anios_precursorado,
                CAST((strftime('%Y', '${hasta}') - strftime('%Y', MIN(i.mes))) * 12 + (strftime('%m', '${hasta}') - strftime('%m', MIN(i.mes))) + 1 AS INTEGER) AS meses_precursorado,
                SUM(CASE WHEN strftime('%m', i.mes) = '09' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS sep,
                SUM(CASE WHEN strftime('%m', i.mes) = '10' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS oct,
                SUM(CASE WHEN strftime('%m', i.mes) = '11' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS nov,
                SUM(CASE WHEN strftime('%m', i.mes) = '12' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS dic,
                SUM(CASE WHEN strftime('%m', i.mes) = '01' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS ene,
                SUM(CASE WHEN strftime('%m', i.mes) = '02' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS feb,
                SUM(CASE WHEN strftime('%m', i.mes) = '03' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS mar,
                SUM(CASE WHEN strftime('%m', i.mes) = '04' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS abr,
                SUM(CASE WHEN strftime('%m', i.mes) = '05' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS may,
                SUM(CASE WHEN strftime('%m', i.mes) = '06' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS jun,
                SUM(CASE WHEN strftime('%m', i.mes) = '07' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS jul,
                SUM(CASE WHEN strftime('%m', i.mes) = '08' THEN i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0))) ELSE null END) AS ago,
                COALESCE(SUM(i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0)))), 0) AS suma,
                COALESCE(AVG(i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0)))), 0) AS promedio,
                count(1) AS meses
            FROM Informes i
            LEFT JOIN Publicadores p ON i.id_publicador = p.id
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            WHERE tp.descripcion = 'Precursor regular'
              AND date(i.mes) BETWEEN date('${desde}') AND date('${hasta}')
            GROUP BY p.id
            ORDER BY p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT });

        /*const data = rows.map((row) => ({
            ...row,
            promedio: parseFloat((row.suma / 6).toFixed(1)),
            meses: 6
        }));*/

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getPrecursoresRegulares:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const getIrregulares = async (req, res) => {
    try {
        const mes = req.params.mes;
        if (!mes || !/^[0-9]{4}-[0-9]{2}-01$/.test(mes)) {
            return res.status(400).json({ success: false, error: 'mes inválido; use YYYY-MM' });
        }

        const publicadores = await sequelize.query(`
           SELECT
                p.id,
                p.nombre,
                p.apellidos,
                p.nombre || ' ' || p.apellidos as publicador,
                (	select min(mes)
                	FROM Informes a
                    WHERE a.id_publicador = p.id) AS inicio_predicacion,
                CASE WHEN (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = p.id
                      AND DATE(a.mes) BETWEEN date(date('${mes}'), '-6 months')
                      AND date('${mes}')
                ) > 0 THEN 'Irregular' ELSE 'Inactivo' END AS Estatus
            FROM Publicadores p
            LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
            LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
 			WHERE (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = p.id
                      AND DATE(a.mes) BETWEEN date(date('${mes}'), '-6 months')
                      AND date('${mes}')
            ) < 6
            ORDER BY Estatus DESC, apellidos, nombre
        `, { type: QueryTypes.SELECT });

        // Informes en últimos 6 meses
        const informes = await Informes.findAll({
            where: {
                mes: {
                    [Op.between]: [dayjs(mes).subtract(5, 'month').format('YYYY-MM-DD'), dayjs(mes).format('YYYY-MM-DD')]
                },
                id_publicador: {
                    [Op.in]: publicadores.map(p => p.id)
                }
            },
            order: [['id_publicador', 'ASC'], ['mes', 'ASC']]
        });

        const months = [];
        for (let i = 0; i < 6; i++) {
            months.push(dayjs(mes).subtract(5, 'month').add(i, 'month').format('YYYY-MM'));
        }

        const rows = [];
        for (const pub of publicadores) {
            const started = pub.inicio_predicacion ? dayjs(pub.inicio_predicacion).startOf('month') : null;
            const effectiveStartMonth = started && started.isAfter(dayjs(mes).subtract(5, 'month')) ? started : dayjs(mes).subtract(5, 'month');

            const expectedMonths = started
                ? Math.min(6, dayjs(mes).diff(started.startOf('month'), 'month') + 1)
                : 6;

            if (expectedMonths <= 0) continue;

            const monthInfos = months
                .filter((m) => {
                    const mday = dayjs(`${m}-01`);
                    return !started || !mday.isBefore(started);
                })
                .map((m) => {
                    const informe = informes.find((inf) => inf.id_publicador === pub.id && dayjs(inf.mes).format('YYYY-MM') === m);
                    return {
                        mes: m,
                        predico: informe ? !!informe.predico_en_el_mes : false
                    };
                });

            const predicados = monthInfos.filter((item) => item.predico).length;
            const faltantes = expectedMonths - predicados;

            let maxConsecutivos = 0;
            let current = 6;
            for (const index in monthInfos) {
                if (monthInfos[index].predico) {
                    current = 5 - index;
                }
            }
            maxConsecutivos = Math.max(maxConsecutivos, current);

            if (predicados < expectedMonths) {
                rows.push({
                    id: pub.id,
                    nombre: pub.nombre,
                    apellidos: pub.apellidos,
                    publicador: `${pub.nombre} ${pub.apellidos}`,
                    inicio_predicacion: started ? started.format('YYYY-MM-DD') : null,
                    meses_a_predicar: expectedMonths,
                    meses_predicados: predicados,
                    meses_faltantes: faltantes,
                    consecutivos_sin_predicar: maxConsecutivos,
                    detalle_meses: monthInfos
                });
            }
        }

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error getIrregulares:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const exportInformes = async (req, res) => {
    try {
        const { format = 'xlsx' } = req.query;
        const rows = await sequelize.query(`
            SELECT 
                p.nombre || ' ' || p.apellidos AS Nombre,
                i.mes AS Mes,
                i.mes_enviado AS 'Mes enviado',
                CASE WHEN i.predico_en_el_mes = 1 THEN 'Sí' ELSE 'No' END AS 'Predicó en el mes',
                i.cursos_biblicos AS 'Cursos bíblicos',
                tp.descripcion AS 'Tipo Publicador',
                i.horas AS Horas,
                i.notas AS Notas,
                i.horas_SS AS 'Horas S. S. (PR)'
            FROM Informes i
            LEFT JOIN Publicadores p ON i.id_publicador = p.id
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            ORDER BY i.mes DESC, p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT });

        handleExport(res, rows, format, 'Informes');
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

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
    // Iniciar una transacción para evitar bloqueos de SQLite
    const transaction = await sequelize.transaction();

    try {
        const informesData = req.body; // Espera un array de objetos informe
        if (!Array.isArray(informesData) || informesData.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, error: 'El cuerpo de la solicitud debe ser un array no vacío de objetos informe.' });
        }

        // Procesar informes secuencialmente dentro de la transacción
        const results = [];
        for (const informe of informesData) {
            const { id_publicador, mes, ...updateFields } = informe;
            if (!id_publicador || !mes) {
                await transaction.rollback();
                throw new Error('Cada informe debe tener id_publicador y mes.');
            }

            const [record, created] = await Informes.findOrCreate({
                where: { id_publicador, mes },
                defaults: informe,
                transaction // Usar la transacción
            });

            if (!created) {
                // Si el registro ya existía, actualízalo
                await record.update(updateFields, { transaction });
            }
            results.push({ id: record.id, created: created });
        }

        // Confirmar la transacción antes de enviar el correo
        await transaction.commit();

        // =====================================================================================
        // ENVIAR NOTIFICACIÓN POR CORREO
        // =====================================================================================
        try {
            // Obtener el correo del administrador desde la tabla Configuraciones
            const configCorreo = await Configuracion.findOne({
                where: { clave: 'correo_admin' }
            });

            if (configCorreo && configCorreo.valor) {
                // Extraer información del primer informe (asumiendo que todos son del mismo mes y grupo)
                const primerInforme = informesData[0];
                const mes = primerInforme.mes;

                // Obtener el grupo del publicador
                const publicador = await Publicadores.findByPk(primerInforme.id_publicador);
                const grupo = publicador ? publicador.grupo : 'N/A';

                // Obtener el nombre del usuario autenticado
                const usuario = req.user?.username || req.user?.email || 'Usuario desconocido';

                // Crear el contenido HTML del correo
                const htmlContent = createBulkReportEmailHTML(usuario, mes, grupo);

                // Enviar el correo
                await sendEmail(
                    configCorreo.valor,
                    '📊 Notificación de Editor de Informes',
                    htmlContent
                );

                console.log('Notificación por correo enviada exitosamente');
            } else {
                console.warn('No se encontró configuración de correo_admin, se omite el envío de correo');
            }
        } catch (emailError) {
            // Si falla el envío del correo, registrar el error pero no interrumpir la respuesta
            console.error('Error al enviar notificación por correo:', emailError.message);
            // No retornamos error aquí para que la inserción de informes sea exitosa independientemente del correo
        }

        res.json({ success: true, results });
    } catch (error) {
        // Si hay un error, hacer rollback de la transacción si aún está activa
        if (!transaction.finished) {
            await transaction.rollback();
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// =====================================================================================
// ELIMINAR INFORMES ANTIGUOS (2+ AÑOS DESDE EL ÚLTIMO INFORME DE CADA PUBLICADOR)
// =====================================================================================
const deleteOldInformes = async (req, res) => {
    try {
        let totalDeleted = 0;

        // Obtener todos los publicadores
        const publicadores = await Publicadores.findAll({
            attributes: ['id']
        });

        // Para cada publicador, encontrar su último informe y eliminar los de 2+ años atrás
        for (const publicador of publicadores) {
            // Encontrar el último informe del publicador
            const ultimoInforme = await Informes.findOne({
                where: { id_publicador: publicador.id },
                order: [['mes', 'DESC']],
                attributes: ['mes']
            });

            if (!ultimoInforme) {
                // Si el publicador no tiene informes, continuar con el siguiente
                continue;
            }

            // Calcular la fecha límite (2 años atrás desde el último informe)
            const ultimaFecha = new Date(ultimoInforme.mes);
            const fechaLimite = new Date(ultimaFecha.getFullYear() - 2, ultimaFecha.getMonth(), ultimaFecha.getDate());
            const fechaLimiteStr = fechaLimite.toISOString().substring(0, 10);

            // Eliminar informes antiguos para este publicador
            const deleted = await Informes.destroy({
                where: {
                    id_publicador: publicador.id,
                    mes: {
                        [Op.lt]: fechaLimiteStr
                    }
                }
            });

            totalDeleted += deleted;
        }

        res.json({
            success: true,
            message: `Se eliminaron ${totalDeleted} informes antiguos (2+ años desde el último informe de cada publicador)`,
            deleted: totalDeleted
        });
    } catch (error) {
        console.error('Error deleting old informes:', error);
        res.json({ success: false, error: error.message });
    }
};

export default {
    getInformes,
    getIrregulares,
    getPrecursoresRegulares,
    addInforme,
    importInformes,
    updateInforme,
    deleteInforme,
    upsertInformesBulk,
    exportInformes,
    deleteOldInformes
};