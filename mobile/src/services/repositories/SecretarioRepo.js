import { Publicadores, Informes, Asistencias, Configuracion, Privilegio, TipoPublicador, sequelize, QueryTypes } from '../models';
import { Alert } from 'react-native';
import dayjs from 'dayjs';

// =====================================================================================
// S3 (RAW Query Compleja con CTE)
// =====================================================================================
export const getS3 = async (anio, type) => {
    if (!anio || isNaN(anio) || anio < 2020) {
        return { success: false, error: 'Año inválido' };
    }
    try {
        const rows = await sequelize.query(`
            SELECT (month + 3) % 12 + 1 AS id,
                   CASE WHEN month > 8 THEN 1 ELSE 0 END + year AS anio_servicio,
                   year, month, type, semana_1, semana_2, semana_3, semana_4, semana_5
            FROM (
                SELECT year, month, type,
                       SUM(CASE WHEN week_of_month = 1 THEN asistentes END) AS semana_1,
                       SUM(CASE WHEN week_of_month = 2 THEN asistentes END) AS semana_2,
                       SUM(CASE WHEN week_of_month = 3 THEN asistentes END) AS semana_3,
                       SUM(CASE WHEN week_of_month = 4 THEN asistentes END) AS semana_4,
                       SUM(CASE WHEN week_of_month = 5 THEN asistentes END) AS semana_5
                FROM (
                    SELECT asistentes,
                           CAST(SUBSTR(fecha, 1, 4) AS INTEGER) AS year,
                           CAST(SUBSTR(fecha, 6, 2) AS INTEGER) AS month,
                           CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END AS type,
                           ((CAST(SUBSTR(fecha, 9, 2) AS INTEGER) - 1) / 7) + 1 AS week_of_month
                    FROM Asistencias
                    WHERE asistentes IS NOT NULL
                ) a
                GROUP BY year, month, type
            ) b
            WHERE CASE WHEN month > 8 THEN 1 ELSE 0 END + year = ? AND type = ?
            ORDER BY year, month
        `, {
            replacements: [parseInt(anio, 10), type],
            type: QueryTypes.SELECT
        });

        return { success: true, data: rows };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// S1 (RAW Query con múltiples cálculos)
// =====================================================================================
export const getS1 = async (month) => {
    if (!month || !/^\d{4}-\d{2}-\d{2}$/.test(month)) {
        return { success: false, error: 'Mes inválido' };
    }

    try {
        // Activos
        const activos = await sequelize.query(
            `SELECT COUNT(1) AS activos
             FROM Publicadores p
             WHERE (SELECT SUM(predico_en_el_mes)
                    FROM Informes i
                    WHERE i.id_publicador = p.id
                      AND DATE(SUBSTR(i.mes, 1, 10)) BETWEEN DATE(?, '-5 months') AND DATE(?)
                ) > 0`,
            { replacements: [month, month], type: QueryTypes.SELECT }
        );

        // Asistencia promedio
        const asistencia = await sequelize.query(
            `SELECT SUM(asistentes) / COUNT(1) AS asistencia_promedio
             FROM Asistencias
             WHERE asistentes IS NOT NULL
               AND CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6)
               AND STRFTIME('%Y-%m-01', SUBSTR(fecha, 1, 10)) = ?`,
            { replacements: [month], type: QueryTypes.SELECT }
        );
        // Encabezados (RAW mapping safely using JavaScript instead of SQL Window Functions)
        const encabezados = [
            { titulo: '', subsecciones: [] },
            { titulo: 'Publicadores', subsecciones: [] },
            { titulo: 'Precursores auxiliares', subsecciones: [] },
            { titulo: 'Precursores regulares', subsecciones: [] }
        ];

        // 3. Stats by type of publisher
        const subsecciones = await sequelize.query(
            `SELECT tp.descripcion as tipo,
                    COUNT(1) AS cantidad,
                    SUM(horas) AS horas,
                    SUM(cursos_biblicos) AS cursos_biblicos
             FROM Informes i
             INNER JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
             WHERE i.predico_en_el_mes = 1
               AND SUBSTR(i.mes, 1, 10) = ?
             GROUP BY tp.descripcion`,
            { replacements: [month], type: QueryTypes.SELECT }
        );

        encabezados[0].subsecciones = [
            { label: 'Publicadores activos', valor: activos[0]?.activos || 0 },
            { label: 'Asistencia promedio (fines de semana)', valor: asistencia[0]?.asistencia_promedio || 0 }
        ];

        const getStats = (tipo) => {
            const sec = subsecciones.find((x) => String(x.tipo).toLowerCase().includes(tipo));
            return tipo === 'publicador' ? [
                { label: 'Cantidad de informes', valor: sec?.cantidad || 0 },
                { label: 'Cursos bíblicos', valor: sec?.cursos_biblicos || 0 }
            ] : [
                { label: 'Cantidad de informes', valor: sec?.cantidad || 0 },
                { label: 'Horas', valor: sec?.horas || 0 },
                { label: 'Cursos bíblicos', valor: sec?.cursos_biblicos || 0 }
            ];
        };

        encabezados[1].subsecciones = getStats('publicador');
        encabezados[2].subsecciones = getStats('auxiliar');
        encabezados[3].subsecciones = getStats('regular');

        return { success: true, data: encabezados };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// =====================================================================================
// S10 - Análisis de la congregación (RAW Query)
// =====================================================================================
export const getS10 = async (anio) => {
    if (!anio || isNaN(anio) || anio < 2020) {
        return { success: false, error: 'Año inválido' };
    }

    try {
        const startMonth = `${anio - 1}-09-01`;
        const endMonth = `${anio}-08-01`;

        // 1. Average attendance for weekend meetings
        const asistenciaFS = await sequelize.query(
            `select round(avg(asistencia), 0) as promedio
                from (
                    SELECT
                        CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END as type,
                        CAST(strftime('%m', SUBSTR(fecha, 1, 10)) AS INTEGER) AS month,
                        CAST(strftime('%Y', SUBSTR(fecha, 1, 10)) AS INTEGER) AS year,
                        avg(asistentes) AS asistencia
                    FROM Asistencias
                    where asistentes is not null
                    GROUP BY strftime('%Y-%m', SUBSTR(fecha, 1, 10)), CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
                ) a
                WHERE case when month > 8 then 1 else 0 end + year = ?
                and type = 'FS';`,
            { replacements: [anio], type: QueryTypes.SELECT }
        );

        // 2. Average attendance for midweek meetings
        const asistenciaES = await sequelize.query(
            `select round(avg(asistencia), 0) as promedio
                from (
                    SELECT
                        CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END as type,
                        CAST(strftime('%m', SUBSTR(fecha, 1, 10)) AS INTEGER) AS month,
                        CAST(strftime('%Y', SUBSTR(fecha, 1, 10)) AS INTEGER) AS year,
                        avg(asistentes) AS asistencia
                    FROM Asistencias
                    where asistentes is not null
                    GROUP BY strftime('%Y-%m', SUBSTR(fecha, 1, 10)), CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
                ) a
                WHERE case when month > 8 then 1 else 0 end + year = ?
                and type = 'ES';`,
            { replacements: [anio], type: QueryTypes.SELECT }
        );

        // 3. Active publishers
        const activosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores p
             WHERE (SELECT SUM(predico_en_el_mes)
                    FROM Informes i
                    WHERE i.id_publicador = p.id
                      AND DATE(SUBSTR(i.mes, 1, 10)) BETWEEN DATE(?, '-5 months') AND DATE(?)
                ) > 0`,
            { replacements: [endMonth, endMonth], type: QueryTypes.SELECT }
        );

        // 4. New inactive publishers
        const inactivosResult = await sequelize.query(
            `SELECT COUNT(DISTINCT id_publicador) AS cantidad
            FROM (
                SELECT *,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(SUBSTR(mes, 1, 10)) between date(SUBSTR(i.mes, 1, 10), '-6 months') and date(SUBSTR(i.mes, 1, 10), '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(SUBSTR(mes, 1, 10)) between date(SUBSTR(i.mes, 1, 10), '-5 months') and date(SUBSTR(i.mes, 1, 10))) > 0 then 'Activo' else 'Inactivo' end as Estatus
                FROM Informes i
            ) tmp
            WHERE EstatusAnterior = 'Activo'
            AND Estatus = 'Inactivo'
            AND SUBSTR(mes, 1, 10) >= ?
            AND SUBSTR(mes, 1, 10) <= ?`,
            { replacements: [startMonth, endMonth], type: QueryTypes.SELECT }
        );

        // 5. Reactivated publishers
        const reactivadosResult = await sequelize.query(
            `SELECT COUNT(DISTINCT id_publicador) AS cantidad
            FROM (
                SELECT *,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(SUBSTR(mes, 1, 10)) between date(SUBSTR(i.mes, 1, 10), '-6 months') and date(SUBSTR(i.mes, 1, 10), '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(SUBSTR(mes, 1, 10)) between date(SUBSTR(i.mes, 1, 10), '-5 months') and date(SUBSTR(i.mes, 1, 10))) > 0 then 'Activo' else 'Inactivo' end as Estatus
                FROM Informes i
            )tmp
            WHERE EstatusAnterior = 'Inactivo'
            AND Estatus = 'Activo'
            AND ifnull(notas, '') != 'Nuevo Publicador'
            AND SUBSTR(mes, 1, 10) >= ?
            AND SUBSTR(mes, 1, 10) <= ?`,
            { replacements: [startMonth, endMonth], type: QueryTypes.SELECT }
        );

        // 6. Deaf publishers
        const sordosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE sordo = 1`,
            { type: QueryTypes.SELECT }
        );

        // 7. Blind publishers
        const ciegosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE ciego = 1`,
            { type: QueryTypes.SELECT }
        );

        // 8. Incarcerated publishers
        const encarceladosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE encarcelado = 1`,
            { type: QueryTypes.SELECT }
        );

        // 9. Territory data from Configuraciones table
        const totalTerritorios = await sequelize.query(
            `SELECT valor
             FROM Configuraciones
             WHERE clave = 'total_territorios'`,
            { type: QueryTypes.SELECT }
        );

        const territoriosNoPredicados = await sequelize.query(
            `SELECT valor
             FROM Configuraciones
             WHERE clave = 'territorios_no_predicados'`,
            { type: QueryTypes.SELECT }
        );

        // Build response object
        const data = {
            anio_servicio: anio,
            asistencia: {
                fin_de_semana: Math.round((asistenciaFS[0]?.promedio || 0) * 100) / 100,
                entre_semana: Math.round((asistenciaES[0]?.promedio || 0) * 100) / 100
            },
            totales_congregacion: {
                publicadores_activos: activosResult[0]?.cantidad || 0,
                nuevos_inactivos: inactivosResult[0]?.cantidad || 0,
                reactivados: reactivadosResult[0]?.cantidad || 0,
                sordos: sordosResult[0]?.cantidad || 0,
                ciegos: ciegosResult[0]?.cantidad || 0,
                encarcelados: encarceladosResult[0]?.cantidad || 0
            },
            territorios: {
                total: parseInt(totalTerritorios[0]?.valor || 0),
                no_predicados: parseInt(territoriosNoPredicados[0]?.valor || 0)
            }
        };

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
