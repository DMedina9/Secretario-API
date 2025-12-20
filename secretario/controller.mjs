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
export const getS3 = async ([anio, type]) => {
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
