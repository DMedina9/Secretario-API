import { Informes, Publicadores, PrecursoresAuxiliares, sequelize, QueryTypes } from '../models';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

export const getInformesByPublicadorAndAnio = async (id_publicador, anio_servicio, mes) => {
    return await sequelize.query(`
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
                      AND DATE(a.mes) BETWEEN DATE(i.mes, '-5 months')
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
            ORDER BY i.mes asc, p.apellidos, p.nombre
            `,
        { type: QueryTypes.SELECT }
    );
};

export const getPrecursoresRegulares = async (anio_servicio) => {
    const desde = `${anio_servicio - 1}-09-01`;
    const hasta = `${anio_servicio}-08-01`;

    return await sequelize.query(`
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
};

export const getIrregulares = async (mes) => {
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
                      AND DATE(a.mes) BETWEEN date(date('${mes}'), '-5 months')
                      AND date('${mes}')
                ) > 0 THEN 'Irregular' ELSE 'Inactivo' END AS Estatus
            FROM Publicadores p
            LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
            LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
 			WHERE (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = p.id
                      AND DATE(a.mes) BETWEEN date(date('${mes}'), '-5 months')
                      AND date('${mes}')
            ) < 6
            ORDER BY Estatus DESC, apellidos, nombre
        `, { type: QueryTypes.SELECT });

    // Informes en últimos 6 meses
    const informes_data = await Informes.findAll({
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
                const informe = informes_data.find((inf) => inf.id_publicador === pub.id && dayjs(inf.mes).format('YYYY-MM') === m);
                return {
                    mes: m,
                    predico: informe ? !!informe.predico_en_el_mes : false
                };
            });

        const predicados = monthInfos.filter((item) => item.predico).length;
        const faltantes = expectedMonths - predicados;

        let maxConsecutivos = 0;
        let current = 0;
        // Search reversed to find consecutive months without preaching from the end
        for (let i = monthInfos.length - 1; i >= 0; i--) {
            if (!monthInfos[i].predico) {
                current++;
            } else {
                break;
            }
        }
        maxConsecutivos = current;

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
                detalle_meses: monthInfos,
                Estatus: pub.Estatus
            });
        }
    }

    return rows.sort((a, b) => b.Estatus.localeCompare(a.Estatus) || a.apellidos.localeCompare(b.apellidos));
};

export const savePrecursorAuxiliar = async (data) => {
    try {
        if (data.id) {
            const pa = await PrecursoresAuxiliares.findByPk(data.id);
            if (pa) {
                await pa.update({ ...data });
                return true;
            }
        }
        await PrecursoresAuxiliares.create({ ...data });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const deletePrecursorAuxiliar = async (id) => {
    try {
        const pa = await PrecursoresAuxiliares.findByPk(id);
        if (pa) {
            await pa.destroy();
            return true;
        }
        return false;
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const saveInforme = async (data) => {
    const { id, ...rest } = data;
    if (id) {
        const i = await Informes.findByPk(id);
        if (i) return await i.update({ ...rest });
    } else {
        return await Informes.create({ ...rest });
    }
};

export const deleteInforme = async (id) => {
    const i = await Informes.findByPk(id);
    if (i) return await i.destroy();
    return false;
};

export const getPrecursoresAuxiliaresByMonth = async (mes) => {
    return await sequelize.query(`
            SELECT pa.*,
                p.nombre, p.apellidos, p.grupo,
                (CAST(STRFTIME('%m', pa.mes) AS INTEGER) + 3) % 12 + 1 AS iNumMes
            FROM PrecursoresAuxiliares pa
            LEFT JOIN Publicadores p ON pa.id_publicador = p.id
            WHERE 1 = 1
            ${mes ? `AND pa.mes = :mes` : ''}
            ORDER BY pa.mes ASC, p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT, replacements: { mes } });
};
