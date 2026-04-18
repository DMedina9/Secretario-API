import { Publicadores, TipoPublicador, sequelize, QueryTypes, Informes } from '../models';

export const getAllPublicadores = async (grupo) => {
    return await sequelize.query(`
        SELECT
            p.*,
            CASE p.sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' END AS sup_grupo_desc,
            pr.descripcion AS privilegio,
            tp.descripcion AS tipo_publicador,
            CASE WHEN (
                SELECT SUM(predico_en_el_mes)
                FROM Informes a
                WHERE a.id_publicador = p.id
                    AND DATE(a.mes) BETWEEN date(date('now', 'start of month'), '-5 months')
                    AND date('now', 'start of month')
            ) > 0 THEN 'Activo' ELSE 'Inactivo' END AS Estatus
        FROM Publicadores p
        LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
        LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
        ${grupo ? 'WHERE p.grupo = ' + grupo : ''}
        ORDER BY grupo, apellidos, nombre
    `, { type: QueryTypes.SELECT })
};

export const getPublicadorById = async (id) => {
    const p = await Publicadores.findByPk(id);
    return p ? p.toJSON() : null;
};

export const getTiposPublicador = async () => {
    return await TipoPublicador.findAll({ raw: true });
};

export const savePublicador = async (data) => {
    const { id, ...rest } = data;
    if (id) {
        // Update
        const p = await Publicadores.findByPk(id);
        if (p) {
            return await p.update({ ...rest });
        }
        return null;
    } else {
        // Create
        return await Publicadores.create({ ...rest });
    }
};

export const deletePublicador = async (id) => {
    await Informes.destroy({ where: { id_publicador: id } })
    const result = await Publicadores.destroy({ where: { id: id } })
    return result;
};
