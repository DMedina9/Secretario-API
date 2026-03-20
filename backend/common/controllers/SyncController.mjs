import { Publicadores, Informes, Asistencias, Configuracion, PrecursoresAuxiliares, Privilegio, TipoPublicador, sequelize } from '../models/Secretario.mjs';
import { QueryTypes } from 'sequelize';

const getAllData = async (req, res) => {
    try {
        // Publicadores with extra info
        const publicadores = await sequelize.query(`
            SELECT
                p.*,
                CASE p.sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' END AS sup_grupo_desc,
                pr.descripcion AS privilegio,
                tp.descripcion AS tipo_publicador,
                CASE WHEN (
                    SELECT SUM(predico_en_el_mes)
                    FROM Informes a
                    WHERE a.id_publicador = p.id
                      AND DATE(a.mes) BETWEEN date(date('now', 'start of month'), '-6 months')
                      AND date('now', 'start of month')
                ) > 0 THEN 'Activo' ELSE 'Inactivo' END AS Estatus
            FROM Publicadores p
            LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
            LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
        `, { type: QueryTypes.SELECT });

        const informes = await Informes.findAll();
        const asistencias = await Asistencias.findAll();
        const configuraciones = await Configuracion.findAll();
        const precursoresAuxiliares = await PrecursoresAuxiliares.findAll();
        const privilegios = await Privilegio.findAll();
        const tiposPublicador = await TipoPublicador.findAll();

        res.json({
            success: true,
            data: {
                publicadores,
                informes,
                asistencias,
                configuraciones,
                precursoresAuxiliares,
                privilegios,
                tiposPublicador
            }
        });
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { getAllData };
