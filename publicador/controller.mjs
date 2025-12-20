import { Publicadores, Informes, Privilegio, TipoPublicador, sequelize } from '../common/models/Secretario.mjs';
import { QueryTypes } from 'sequelize'
import xlsx from 'xlsx'

// =====================================================================================
// OBTENER PRIVILEGIOS
// =====================================================================================
export const getPrivilegios = async () => {
    try {
        const rows = await Privilegio.findAll({ order: [['id', 'ASC']] })
        return { success: true, data: rows }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// =====================================================================================
// OBTENER TIPOS PUBLICADOR
// =====================================================================================
export const getTiposPublicador = async () => {
    try {
        const rows = await TipoPublicador.findAll({ order: [['id', 'ASC']] })
        return { success: true, data: rows }
    } catch (error) {
        return { success: false, error: error.message }
    }
}


// =====================================================================================
// OBTENER PUBLICADOR
// =====================================================================================
const getPublicador = async (req, res) => {
    const publicador = await Publicadores.findByPk(req.params.id);
    if (!publicador) return res.status(404).json({ error: 'Publicador not found' });
    res.json({ success: true, data: publicador });
};

// =====================================================================================
// OBTENER PUBLICADORES
// =====================================================================================
const getAllPublicadores = async (req, res) => {
    const publicadores = await Publicadores.findAll();
    res.json({ success: true, data: publicadores });
};
const getPublicadoresByGrupo = async (req, res) => {
    const publicadores = await Publicadores.findAll({ where: { grupo: req.params.grupo } });
    res.json({ success: true, data: publicadores });
};
// =====================================================================================
// OBTENER PUBLICADORES (RAW por el CASE)
// =====================================================================================
const getPublicadores = async (req, res) => {
    try {
        const rows = await sequelize.query(`
            SELECT
                p.*,
                CASE sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' END AS sup_grupo_desc,
                pr.descripcion AS privilegio,
                tp.descripcion AS tipo_publicador
            FROM Publicadores p
            LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
            LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
            ORDER BY grupo, apellidos, nombre
        `, { type: QueryTypes.SELECT })

        res.json({ success: true, data: rows })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

const importPublicadores = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Archivo no recibido' });
        }
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheet = workbook.Sheets['Publicadores'];
        if (!sheet) {
            return res.status(400).json({
                success: false,
                message: 'No se encontró la hoja "Publicadores"'
            });
        }

        const jsonPublicadores = xlsx.utils.sheet_to_json(sheet, {
            defval: null
        });
        const privilegios = await getPrivilegios();
        const tipos_publicadores = await getTiposPublicador();
        for (const p of jsonPublicadores) {
            let nombre =
                p.Nombre && p.Nombre.indexOf(',') !== -1
                    ? p.Nombre.substring(p.Nombre.indexOf(',') + 2)
                    : p.Nombre
            let apellidos =
                p.Nombre && p.Nombre.indexOf(',') !== -1
                    ? p.Nombre.substring(0, p.Nombre.indexOf(','))
                    : ''
            if (nombre == 'Total') continue // Ignorar filas de totales

            let tipo_publicador = tipos_publicadores.data.find(
                (tp) => tp.descripcion == p['Tipo Publicador']
            )
            let privilegio = privilegios.data.find((pr) => pr.descripcion == p.Privilegio)
            await Publicadores.upsert({
                nombre,
                apellidos,
                fecha_nacimiento: p['Fecha de nacimiento']?.toISOString().substring(0, 10),
                fecha_bautismo: p['Fecha de bautismo']?.toISOString().substring(0, 10),
                grupo: p.Grupo,
                sup_grupo: p['Sup. Grupo'] === 'Sup' ? 1 : p['Sup. Grupo'] === 'Aux' ? 2 : 0,
                sexo: p.Sexo?.substring(0, 1),
                id_privilegio: privilegio?.id,
                id_tipo_publicador: tipo_publicador?.id,
                ungido: p.Ungido ? 1 : 0,
                calle: p.Calle,
                num: p.Núm,
                colonia: p.Colonia,
                telefono_fijo: p['Teléfono fijo'],
                telefono_movil: p['Teléfono móvil'],
                contacto_emergencia: p['Contacto de emergencia'],
                telefono_contacto_emergencia: p['Tel. Contacto de emergencia'],
                correo_contacto_emergencia: p['Correo Contacto de emergencia']
            });
        }
        res.json({ success: true, data: jsonPublicadores });

    } catch (error) {
        console.error(error);
        res.json({ success: false, error: error.message });
    }
}
// =====================================================================================
// AGREGAR PUBLICADOR
// =====================================================================================
const addPublicador = async (req, res) => {
    try {
        const item = await Publicadores.create(req.body)
        res.json({ success: true, lastID: item.id })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ACTUALIZAR PUBLICADOR
// =====================================================================================
const updatePublicador = async (req, res) => {
    try {
        const result = await Publicadores.update(
            req.body,
            { where: { id: req.params.id } }
        )
        res.json({ success: true, changes: result[0] })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}

// =====================================================================================
// ELIMINAR PUBLICADOR + SUS INFORMES
// =====================================================================================
const deletePublicador = async (req, res) => {
    try {
        await Informes.destroy({ where: { id_publicador: req.params.id } })
        const result = await Publicadores.destroy({ where: { id: req.params.id } })
        res.json({ success: true, changes: result })
    } catch (error) {
        res.json({ success: false, error: error.message })
    }
}
export default {
    getPrivilegios,
    getTiposPublicador,
    getPublicador,
    getAllPublicadores,
    getPublicadoresByGrupo,
    getPublicadores,
    importPublicadores,
    addPublicador,
    updatePublicador,
    deletePublicador
};