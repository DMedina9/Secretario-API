// services.mjs
import { sequelize } from '../common/models/Secretario.mjs'
import {
    Privilegio,
    TipoPublicador
} from '../common/models/Secretario.mjs'
import { Op, QueryTypes } from 'sequelize'

// =====================================================================================
// INSERTAR PRIVILEGIOS
// =====================================================================================
export const insertPrivilegios = async () => {
    for (const descripcion of ['Anciano', 'Siervo ministerial']) {
        await Privilegio.findOrCreate({ where: { descripcion } })
    }
    return { success: true, message: 'Importado Privilegios' }
}

// =====================================================================================
// INSERTAR TIPOS DE PUBLICADOR
// =====================================================================================
export const insertTipoPublicador = async () => {
    for (const descripcion of ['Publicador', 'Precursor regular', 'Precursor auxiliar']) {
        await TipoPublicador.findOrCreate({ where: { descripcion } })
    }
    return { success: true, message: 'Importado Tipos de Publicador' }
}

// =====================================================================================
// OBTENER MES INFORME (RAW)
// =====================================================================================
export const getMesInforme = async () => {
    try {
        const rows = await sequelize.query(
            `SELECT MAX(mes) AS mes FROM Informes`,
            { type: QueryTypes.SELECT }
        )
        if (!rows[0]?.mes) return null

        const [y, m] = rows[0].mes.split('-')
        return new Date(Number(y), Number(m) - 1, 1)
    } catch {
        return null
    }
}

// =====================================================================================
// S3 (RAW Query Compleja con CTE)
// =====================================================================================
export const getS3 = async (anio, type) => {
    if (!anio || isNaN(anio) || anio < 2020) {
        return { success: false, error: 'Año inválido' }
    }
    try {
        const rows = await sequelize.query(`
            WITH weekdays AS (
                SELECT fecha, asistentes,
                    CAST(STRFTIME('%Y', fecha) AS INTEGER) AS year,
                    CAST(STRFTIME('%m', fecha) AS INTEGER) AS month,
                    CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6)
                         THEN 'FS' ELSE 'ES' END AS type,
                    CAST(CAST(STRFTIME('%d', fecha) AS INTEGER) / 7.0 AS INTEGER)
                        + (CAST(STRFTIME('%d', fecha) AS INTEGER) / 7.0 >
                           CAST(CAST(STRFTIME('%d', fecha) AS INTEGER) / 7.0 AS INTEGER)) AS week_of_month
                FROM Asistencias
            ),
            tb AS (
                SELECT year, month, type,
                    SUM(CASE WHEN week_of_month = 1 THEN asistentes END) AS semana_1,
                    SUM(CASE WHEN week_of_month = 2 THEN asistentes END) AS semana_2,
                    SUM(CASE WHEN week_of_month = 3 THEN asistentes END) AS semana_3,
                    SUM(CASE WHEN week_of_month = 4 THEN asistentes END) AS semana_4,
                    SUM(CASE WHEN week_of_month = 5 THEN asistentes END) AS semana_5
                FROM weekdays
                GROUP BY year, month, type
            )
            SELECT (month + 3) % 12 + 1 AS id,
                   CASE WHEN month > 8 THEN 1 ELSE 0 END + year AS anio_servicio,
                   *
            FROM tb
            WHERE anio_servicio = ? AND type = ?
            ORDER BY year, month
        `, {
            replacements: [anio, type],
            type: QueryTypes.SELECT
        })

        return { success: true, data: rows }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================================================================================
// S1 (RAW Query con múltiples cálculos)
// =====================================================================================
export const getS1 = async (month) => {
    if (!month || !/^\d{4}-\d{2}-\d{2}$/.test(month)) {
        return { success: false, error: 'Mes inválido' }
    }

    try {
        // Activos
        const activos = await sequelize.query(
            `SELECT COUNT(1) AS activos
             FROM Publicadores p
             WHERE (SELECT SUM(predico_en_el_mes)
                    FROM Informes i
                    WHERE i.id_publicador = p.id
                      AND DATE(i.mes) BETWEEN DATE(?, '-5 months') AND DATE(?)
                ) > 0`,
            { replacements: [month, month], type: QueryTypes.SELECT }
        )

        // Asistencia promedio
        const asistencia = await sequelize.query(
            `SELECT SUM(asistentes) / COUNT(1) AS asistencia_promedio
             FROM Asistencias
             WHERE asistentes IS NOT NULL
               AND CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6)
               AND STRFTIME('%Y-%m-01', fecha) = ?`,
            { replacements: [month], type: QueryTypes.SELECT }
        )

        // Encabezados (RAW)
        const encabezados = await sequelize.query(
            `WITH tmp AS (
                SELECT ROW_NUMBER() OVER (ORDER BY CASE id WHEN 2 THEN 3 WHEN 3 THEN 2 ELSE id END) AS id, titulo
                FROM (
                    SELECT 0 AS id, '' AS titulo
                    UNION ALL
                    SELECT id, REPLACE(descripcion, 'sor', 'sores') || 'es' AS titulo
                    FROM Tipos_Publicadores
                ) a
            )
            SELECT * FROM tmp ORDER BY id`,
            { type: QueryTypes.SELECT }
        )

        // Subsecciones
        const subsecciones = await sequelize.query(
            `SELECT CASE tp.id WHEN 2 THEN 3 WHEN 3 THEN 2 ELSE tp.id END + 1 AS id,
                    COUNT(1) AS cantidad,
                    SUM(horas) AS horas,
                    SUM(cursos_biblicos) AS cursos_biblicos
             FROM Informes i
             INNER JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
             WHERE i.predico_en_el_mes = 1
               AND i.mes = ?
             GROUP BY tp.id
             ORDER BY CASE tp.id WHEN 2 THEN 3 WHEN 3 THEN 2 ELSE tp.id END`,
            { replacements: [month], type: QueryTypes.SELECT }
        )

        // Construcción final del objeto
        // igual a tu lógica original
        encabezados[0].subsecciones = [
            {
                label: 'Publicadores activos',
                descripcion:
                    'Cuente todas las personas de la congregación que informaron alguna participación en el ministerio un mes o más durante los pasados seis meses.',
                valor: activos[0]?.activos
            },
            {
                label: 'Promedio de asistencia a las reuniones del fin de semana',
                valor: asistencia[0]?.asistencia_promedio
            }
        ]

        const sec2 = subsecciones.find((x) => x.id === 2)
        encabezados[1].subsecciones = [
            { label: 'Cantidad de informes', valor: sec2?.cantidad || 0 },
            { label: 'Cursos bíblicos', valor: sec2?.cursos_biblicos || 0 }
        ]

        const sec3 = subsecciones.find((x) => x.id === 3)
        encabezados[2].subsecciones = [
            { label: 'Cantidad de informes', valor: sec3?.cantidad || 0 },
            { label: 'Horas', valor: sec3?.horas || 0 },
            { label: 'Cursos bíblicos', valor: sec3?.cursos_biblicos || 0 }
        ]

        const sec4 = subsecciones.find((x) => x.id === 4)
        encabezados[3].subsecciones = [
            { label: 'Cantidad de informes', valor: sec4?.cantidad || 0 },
            { label: 'Horas', valor: sec4?.horas || 0 },
            { label: 'Cursos bíblicos', valor: sec4?.cursos_biblicos || 0 }
        ]

        return { success: true, data: encabezados }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================================================================================
// S10 - Análisis de la congregación (RAW Query)
// =====================================================================================
export const getS10 = async (anio) => {
    if (!anio || isNaN(anio) || anio < 2020) {
        return { success: false, error: 'Año inválido' }
    }

    try {
        // Calculate service year date range (Sept to Aug)
        const startMonth = `${anio - 1}-09-01`
        const endMonth = `${anio}-08-01`

        // 1. Average attendance for weekend meetings
        const asistenciaFS = await sequelize.query(
            `select round(avg(asistencia), 0) as promedio
                from (
                    SELECT
                        CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END as type,
                        CAST(strftime('%m', fecha) AS INTEGER) AS month,
                        CAST(strftime('%Y', fecha) AS INTEGER) AS year,
                        avg(asistentes) AS asistencia
                    FROM Asistencias
                    where asistentes is not null
                    GROUP BY strftime('%Y-%m', fecha), CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
                ) a
                WHERE case when month > 8 then 1 else 0 end + year = ?
                and type = 'FS';`,
            { replacements: [anio], type: QueryTypes.SELECT }
        )

        // 2. Average attendance for midweek meetings
        const asistenciaES = await sequelize.query(
            `select round(avg(asistencia), 0) as promedio
                from (
                    SELECT
                        CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END as type,
                        CAST(strftime('%m', fecha) AS INTEGER) AS month,
                        CAST(strftime('%Y', fecha) AS INTEGER) AS year,
                        avg(asistentes) AS asistencia
                    FROM Asistencias
                    where asistentes is not null
                    GROUP BY strftime('%Y-%m', fecha), CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
                ) a
                WHERE case when month > 8 then 1 else 0 end + year = ?
                and type = 'ES';`,
            { replacements: [anio], type: QueryTypes.SELECT }
        )

        // 3. Active publishers (reported at least once in the service year)
        const activosResult = await sequelize.query(
            `WITH tmp AS (
                SELECT *,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-6 months') and date(i.mes, '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-5 months') and date(i.mes)) > 0 then 'Activo' else 'Inactivo' end as Estatus
                FROM Informes i
            )
            SELECT COUNT(DISTINCT id_publicador) AS cantidad
            FROM tmp
            WHERE Estatus = 'Activo'
            AND mes = ?`,
            { replacements: [endMonth], type: QueryTypes.SELECT }
        )

        // 4. New inactive publishers (were active in previous year but not in current year)
        const inactivosResult = await sequelize.query(
            `WITH tmp AS (
                SELECT *,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-6 months') and date(i.mes, '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-5 months') and date(i.mes)) > 0 then 'Activo' else 'Inactivo' end as Estatus
                FROM Informes i
            )
            SELECT COUNT(DISTINCT id_publicador) AS cantidad
            FROM tmp
            WHERE EstatusAnterior = 'Activo'
            AND Estatus = 'Inactivo'
            AND mes >= ?
            AND mes <= ?`,
            { replacements: [startMonth, endMonth], type: QueryTypes.SELECT }
        )

        // 5. Reactivated publishers (inactive in previous year but active in current year)
        const reactivadosResult = await sequelize.query(
            `WITH tmp AS (
                SELECT *,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-6 months') and date(i.mes, '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
                case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-5 months') and date(i.mes)) > 0 then 'Activo' else 'Inactivo' end as Estatus
                FROM Informes i
            )
            SELECT COUNT(DISTINCT id_publicador) AS cantidad
            FROM tmp
            WHERE EstatusAnterior = 'Inactivo'
            AND Estatus = 'Activo'
            AND ifnull(notas, '') != 'Nuevo Publicador'
            AND mes >= ?
            AND mes <= ?`,
            { replacements: [startMonth, endMonth], type: QueryTypes.SELECT }
        )

        // 6. Deaf publishers
        const sordosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE sordo = 1`,
            { type: QueryTypes.SELECT }
        )

        // 7. Blind publishers
        const ciegosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE ciego = 1`,
            { type: QueryTypes.SELECT }
        )

        // 8. Incarcerated publishers
        const encarceladosResult = await sequelize.query(
            `SELECT COUNT(1) AS cantidad
             FROM Publicadores
             WHERE encarcelado = 1`,
            { type: QueryTypes.SELECT }
        )

        // 9. Territory data from Configuracion table
        const totalTerritorios = await sequelize.query(
            `SELECT valor
             FROM Configuraciones
             WHERE clave = 'total_territorios'`,
            { type: QueryTypes.SELECT }
        )

        const territoriosNoPredicados = await sequelize.query(
            `SELECT valor
             FROM Configuraciones
             WHERE clave = 'territorios_no_predicados'`,
            { type: QueryTypes.SELECT }
        )

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
        }

        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

