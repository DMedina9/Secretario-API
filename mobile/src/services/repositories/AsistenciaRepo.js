import { Asistencias, sequelize } from '../models';
import { QueryTypes, Op } from 'sequelize';

export const getAllAsistencias = async () => {
    return await sequelize.query(
        `SELECT *,
            CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (6,0)
            THEN 'Fin de semana' ELSE 'Entresemana' END AS tipo_asistencia
            FROM Asistencias
            ORDER BY fecha DESC`,
        { type: QueryTypes.SELECT }
    )
};

export const saveAsistencia = async (data) => {
    const { id, ...rest } = data;
    if (id) {
        const a = await Asistencias.findByPk(id);
        if (a) return await a.update({ ...rest, is_dirty: true });
    } else {
        return await Asistencias.create({ ...rest, is_dirty: true });
    }
};

export const deleteAsistencia = async (id) => {
    const a = await Asistencias.findByPk(id);
    if (a) return await a.destroy();
    return false;
};

export const deleteOldAsistencias = async () => {
    const today = new Date();
    const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), 1);
    const fechaLimite = twoYearsAgo.toISOString().substring(0, 10);
    
    const result = await Asistencias.destroy({
        where: {
            fecha: {
                [Op.lt]: fechaLimite
            }
        }
    });
    return result;
};
