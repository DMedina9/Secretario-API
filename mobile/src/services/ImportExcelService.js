import { sequelize, QueryTypes } from './models';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import dayjs from 'dayjs';

/**
 * Utility to parse different date formats from Excel (dates, serial numbers, strings).
 */
const parseExcelDate = (val) => {
    if (val === null || val === undefined || val === '') return null;

    // If SheetJS parsed it as a Date
    if (val instanceof Date) {
        if (!isNaN(val.getTime())) {
            return dayjs(val).format('YYYY-MM-DD');
        }
        return null;
    }

    // If it's an Excel numeric date representation (serial number)
    if (typeof val === 'number') {
        const date = new Date((val - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
            return dayjs(date).format('YYYY-MM-DD');
        }
        return null;
    }

    // If it's a string, try parsing with dayjs
    if (typeof val === 'string') {
        const cleaned = val.trim();
        if (!cleaned) return null;

        const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'DD/MM/YYYY'];
        for (const fmt of formats) {
            const parsed = dayjs(cleaned, fmt, true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD');
            }
        }

        const parsedFallback = dayjs(cleaned);
        if (parsedFallback.isValid()) {
            return parsedFallback.format('YYYY-MM-DD');
        }
    }

    return null;
};

/**
 * Inserts default privileges if they don't exist.
 */
export const insertPrivilegios = async () => {
    for (const privilegio of ['Anciano', 'Siervo ministerial']) {
        await sequelize.query(`INSERT OR IGNORE INTO Privilegios (descripcion, createdAt, updatedAt) VALUES (?, datetime('now'), datetime('now'))`, {
            type: QueryTypes.INSERT,
            replacements: [privilegio]
        });
    }
};

/**
 * Inserts default publisher types if they don't exist.
 */
export const insertTipoPublicador = async () => {
    for (const tipo of ['Publicador', 'Precursor regular', 'Precursor auxiliar']) {
        await sequelize.query(`INSERT OR IGNORE INTO Tipos_Publicadores (descripcion, createdAt, updatedAt) VALUES (?, datetime('now'), datetime('now'))`, {
            type: QueryTypes.INSERT,
            replacements: [tipo]
        });
    }
};

/**
 * Generates an Excel template (.xlsx) encoded in base64.
 * Pre-populated with headers and sample rows.
 */
export const generateTemplateXLSX = () => {
    const wb = XLSX.utils.book_new();

    // 1. Publicadores Sheet
    const headersPub = [
        "Nombre", "Nombre completo", "Fecha de nacimiento", "Fecha de bautismo",
        "Grupo", "Sup. Grupo", "Sexo", "Privilegio", "Tipo Publicador", "Ungido",
        "Calle", "Núm", "Colonia", "Teléfono fijo", "Teléfono móvil",
        "Contacto de emergencia", "Tel. Contacto de emergencia", "Correo Contacto de emergencia"
    ];
    const samplePub = {
        "Nombre": "Pérez, Juan",
        "Nombre completo": "Juan Pérez",
        "Fecha de nacimiento": "1990-05-15",
        "Fecha de bautismo": "2010-09-20",
        "Grupo": 1,
        "Sup. Grupo": "Aux",
        "Sexo": "Hombre",
        "Privilegio": "Siervo ministerial",
        "Tipo Publicador": "Publicador",
        "Ungido": "FALSE",
        "Calle": "Calle Falsa",
        "Núm": "123",
        "Colonia": "Centro de la Ciudad",
        "Teléfono fijo": 5551234,
        "Teléfono móvil": 5556789,
        "Contacto de emergencia": "María Pérez",
        "Tel. Contacto de emergencia": 5559876,
        "Correo Contacto de emergencia": "maria.perez@example.com"
    };
    const wsPub = XLSX.utils.json_to_sheet([samplePub], { header: headersPub });
    XLSX.utils.book_append_sheet(wb, wsPub, "Publicadores");

    // 2. Informes Sheet
    const headersInf = [
        "Nombre", "Tipo Publicador", "Mes", "Mes enviado", "Predicó en el mes",
        "Cursos bíblicos", "Horas", "Notas", "Horas S. S. (PR)"
    ];
    const sampleInf = {
        "Nombre": "Pérez, Juan",
        "Tipo Publicador": "Publicador",
        "Mes": "2025-01-01",
        "Mes enviado": "2025-02-01",
        "Predicó en el mes": "TRUE",
        "Cursos bíblicos": 1,
        "Horas": 0,
        "Notas": "Informe inicial de prueba",
        "Horas S. S. (PR)": 0
    };
    const wsInf = XLSX.utils.json_to_sheet([sampleInf], { header: headersInf });
    XLSX.utils.book_append_sheet(wb, wsInf, "Informes");

    // 3. Asistencias Sheet
    const headersAsis = [
        "Fecha", "Asistentes", "Notas"
    ];
    const sampleAsis = {
        "Fecha": "2025-01-05",
        "Asistentes": 85,
        "Notas": "Reunión de fin de semana"
    };
    const wsAsis = XLSX.utils.json_to_sheet([sampleAsis], { header: headersAsis });
    XLSX.utils.book_append_sheet(wb, wsAsis, "Asistencias");

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    return b64;
};

/**
 * Generates an Excel file (.xlsx) encoded in base64 containing the profile
 * details and reports of the publishers in a specific group and month.
 */
export const generateGroupReportsXLSX = async (group, month, bulkData) => {
    // 1. Fetch all publishers in the selected group
    const publicadores = await sequelize.query(`
        SELECT
            p.apellidos || ', ' || p.nombre AS Nombre,
            p.nombre || ' ' || p.apellidos AS 'Nombre completo',
            p.fecha_nacimiento AS 'Fecha de nacimiento',
            p.fecha_bautismo AS 'Fecha de bautismo',
            p.grupo AS Grupo,
            CASE p.sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' ELSE '' END AS 'Sup. Grupo',
            CASE p.sexo WHEN 'H' THEN 'Hombre' WHEN 'M' THEN 'Mujer' ELSE '' END AS Sexo,
            pr.descripcion AS Privilegio,
            tp.descripcion AS 'Tipo Publicador',
            CASE p.ungido WHEN 1 THEN 'TRUE' WHEN 0 THEN 'FALSE' ELSE '' END AS Ungido,
            p.calle AS Calle,
            p.num AS 'Núm',
            p.colonia AS Colonia,
            p.telefono_fijo AS 'Teléfono fijo',
            p.telefono_movil AS 'Teléfono móvil',
            p.contacto_emergencia AS 'Contacto de emergencia',
            p.tel_contacto_emergencia AS 'Tel. Contacto de emergencia',
            p.correo_contacto_emergencia AS 'Correo Contacto de emergencia'
        FROM Publicadores p
        LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
        LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
        WHERE p.grupo = ?
        ORDER BY p.apellidos, p.nombre
    `, { replacements: [group], type: QueryTypes.SELECT });

    // 2. Fetch publisher type catalog to map ID to description
    const tipos = await sequelize.query(`SELECT * FROM Tipos_Publicadores`, { type: QueryTypes.SELECT });
    const tipoMap = {};
    tipos.forEach(t => { tipoMap[t.id] = t.descripcion; });

    // 3. Map bulkData to match "Informes" sheet structure
    const informes = bulkData.map(item => {
        const tipoDesc = tipoMap[item.id_tipo_publicador] || 'Publicador';
        return {
            "Nombre": item.nombre,
            "Tipo Publicador": tipoDesc,
            "Mes": item.mes,
            "Mes enviado": item.mes_envio || '',
            "Predicó en el mes": item.predico_en_el_mes ? 'TRUE' : 'FALSE',
            "Cursos bíblicos": item.cursos_biblicos || 0,
            "Horas": item.horas || 0,
            "Notas": item.notas || '',
            "Horas S. S. (PR)": item.horas_SS || 0
        };
    });

    const wb = XLSX.utils.book_new();

    const headersPub = [
        "Nombre", "Nombre completo", "Fecha de nacimiento", "Fecha de bautismo",
        "Grupo", "Sup. Grupo", "Sexo", "Privilegio", "Tipo Publicador", "Ungido",
        "Calle", "Núm", "Colonia", "Teléfono fijo", "Teléfono móvil",
        "Contacto de emergencia", "Tel. Contacto de emergencia", "Correo Contacto de emergencia"
    ];
    const headersInf = [
        "Nombre", "Tipo Publicador", "Mes", "Mes enviado", "Predicó en el mes",
        "Cursos bíblicos", "Horas", "Notas", "Horas S. S. (PR)"
    ];
    const headersAsis = [
        "Fecha", "Asistentes", "Notas"
    ];

    const wsPub = XLSX.utils.json_to_sheet(publicadores, { header: headersPub });
    XLSX.utils.book_append_sheet(wb, wsPub, "Publicadores");

    const wsInf = XLSX.utils.json_to_sheet(informes, { header: headersInf });
    XLSX.utils.book_append_sheet(wb, wsInf, "Informes");

    const wsAsis = XLSX.utils.json_to_sheet([], { header: headersAsis });
    XLSX.utils.book_append_sheet(wb, wsAsis, "Asistencias");

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    return b64;
};


/**
 * Imports an Excel file from a local document URI.
 * Calls onProgress(progressPercent, message) during the flow.
 */
export const importExcelFromUri = async (uri, onProgress = null) => {
    const notify = (progress, msg) => {
        if (onProgress) onProgress(progress, msg);
    };

    notify(5, "Leyendo archivo...");
    
    // Read the file content as base64
    const fileBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const workbook = XLSX.read(fileBase64, { type: 'base64', cellDates: true });

    // Verify minimum required sheets
    if (!workbook.Sheets['Publicadores']) {
        throw new Error('No se encontró la hoja "Publicadores" en el archivo Excel.');
    }

    notify(15, "Inicializando catálogos...");
    
    // Ensure catalog values exist
    await insertPrivilegios();
    await insertTipoPublicador();

    const Privilegios = await sequelize.query(`SELECT * FROM Privilegios`, { type: QueryTypes.SELECT });
    const TiposPublicadores = await sequelize.query(`SELECT * FROM Tipos_Publicadores`, { type: QueryTypes.SELECT });

    // ─── PART 1: PUBLICADORES ───
    const sheetPub = workbook.Sheets['Publicadores'];
    if (sheetPub) {
        notify(20, "Importando Publicadores...");
        const jsonPub = XLSX.utils.sheet_to_json(sheetPub);
        let pubCount = 0;

        for (let i = 0; i < jsonPub.length; i++) {
            const p = jsonPub[i];
            
            // Skip total/summary rows
            if (!p.Nombre || String(p.Nombre).trim().toLowerCase() === 'total') continue;

            let nombre = p.Nombre;
            let apellidos = '';
            if (p.Nombre.indexOf(',') !== -1) {
                apellidos = p.Nombre.substring(0, p.Nombre.indexOf(',')).trim();
                nombre = p.Nombre.substring(p.Nombre.indexOf(',') + 1).trim();
            }

            const nacimiento = parseExcelDate(p['Fecha de nacimiento']);
            const bautismo = parseExcelDate(p['Fecha de bautismo']);
            
            const grupo = parseInt(p.Grupo) || null;
            
            const supGrupoVal = String(p['Sup. Grupo'] || '').trim();
            const sup_grupo = supGrupoVal === 'Sup' ? 1 : (supGrupoVal === 'Aux' ? 2 : 0);
            
            const sexoVal = String(p.Sexo || '').trim().toUpperCase();
            const sexo = sexoVal.startsWith('H') ? 'H' : (sexoVal.startsWith('M') ? 'M' : 'H');

            const privilegioVal = String(p.Privilegio || '').trim().toLowerCase();
            const privObj = Privilegios.find(pr => pr.descripcion.toLowerCase() === privilegioVal);
            const id_privilegio = privObj ? privObj.id : null;

            const tipoVal = String(p['Tipo Publicador'] || '').trim().toLowerCase();
            const tipoObj = TiposPublicadores.find(tp => tp.descripcion.toLowerCase() === tipoVal);
            const id_tipo_publicador = tipoObj ? tipoObj.id : 1; // Default: 'Publicador' (id = 1)

            const ungidoVal = String(p.Ungido || '').trim().toUpperCase();
            const ungido = (ungidoVal === 'TRUE' || ungidoVal === '1' || ungidoVal === 'SÍ' || ungidoVal === 'SI') ? 1 : 0;

            const params = [
                nombre, apellidos, nacimiento, bautismo, grupo, sup_grupo, sexo,
                id_privilegio, id_tipo_publicador, ungido,
                p.Calle ? String(p.Calle).trim() : null,
                p.Núm ? String(p.Núm).trim() : null,
                p.Colonia ? String(p.Colonia).trim() : null,
                p['Teléfono fijo'] ? parseInt(p['Teléfono fijo']) || null : null,
                p['Teléfono móvil'] ? parseInt(p['Teléfono móvil']) || null : null,
                p['Contacto de emergencia'] ? String(p['Contacto de emergencia']).trim() : null,
                p['Tel. Contacto de emergencia'] ? parseInt(p['Tel. Contacto de emergencia']) || null : null,
                p['Correo Contacto de emergencia'] ? String(p['Correo Contacto de emergencia']).trim() : null
            ];

            await sequelize.query(
                `INSERT INTO Publicadores (
                    nombre, apellidos, fecha_nacimiento, fecha_bautismo,
                    grupo, sup_grupo, sexo, id_privilegio, id_tipo_publicador, ungido, calle, num, colonia,
                    telefono_fijo, telefono_movil, contacto_emergencia, tel_contacto_emergencia, correo_contacto_emergencia,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                ON CONFLICT(nombre, apellidos) DO UPDATE SET
                    fecha_nacimiento = excluded.fecha_nacimiento,
                    fecha_bautismo = excluded.fecha_bautismo,
                    grupo = excluded.grupo,
                    sup_grupo = excluded.sup_grupo,
                    sexo = excluded.sexo,
                    id_privilegio = excluded.id_privilegio,
                    id_tipo_publicador = excluded.id_tipo_publicador,
                    ungido = excluded.ungido,
                    calle = excluded.calle,
                    num = excluded.num,
                    colonia = excluded.colonia,
                    telefono_fijo = excluded.telefono_fijo,
                    telefono_movil = excluded.telefono_movil,
                    contacto_emergencia = excluded.contacto_emergencia,
                    tel_contacto_emergencia = excluded.tel_contacto_emergencia,
                    correo_contacto_emergencia = excluded.correo_contacto_emergencia,
                    updatedAt = datetime('now');`,
                {
                    type: QueryTypes.INSERT,
                    replacements: params
                }
            );
            pubCount++;

            if (i % 5 === 0) {
                notify(20 + Math.round((i / jsonPub.length) * 30), `Publicador importado: ${nombre} ${apellidos}...`);
            }
        }
    }

    // Refresh list of publicadores from DB to get IDs
    const PublicadoresList = await sequelize.query(`SELECT * FROM Publicadores`, { type: QueryTypes.SELECT });

    // Helper to normalize names for mapping
    const normalize = (str) => String(str || '').replace(/\s+/g, ' ').trim().toLowerCase();

    // ─── PART 2: INFORMES ───
    let infCount = 0;
    const sheetInf = workbook.Sheets['Informes'];
    if (sheetInf) {
        notify(55, "Importando Informes...");
        const jsonInf = XLSX.utils.sheet_to_json(sheetInf);

        for (let i = 0; i < jsonInf.length; i++) {
            const p = jsonInf[i];
            
            if (!p.Nombre || String(p.Nombre).trim().toLowerCase() === 'total') continue;

            // Find the matching publisher in the database
            const excelName = normalize(p.Nombre);
            const publicador = PublicadoresList.find(pub => {
                const dbName1 = normalize(`${pub.apellidos || ''}, ${pub.nombre || ''}`);
                const dbName2 = normalize(`${pub.nombre || ''} ${pub.apellidos || ''}`);
                return dbName1 === excelName || dbName2 === excelName;
            });

            if (!publicador) {
                console.warn(`No se encontró el publicador "${p.Nombre}" para asociar el informe.`);
                continue;
            }

            const mes = parseExcelDate(p.Mes);
            if (!mes) continue;

            const mesEnviado = parseExcelDate(p['Mes enviado']);
            
            const predicoVal = String(p['Predicó en el mes'] || '').trim().toUpperCase();
            const predico_en_el_mes = (predicoVal === 'TRUE' || predicoVal === '1' || predicoVal === 'SÍ' || predicoVal === 'SI') ? 1 : 0;
            
            const cursos_biblicos = parseInt(p['Cursos bíblicos']) || 0;
            
            const repTipoVal = String(p['Tipo Publicador'] || '').trim().toLowerCase();
            const repTipoObj = TiposPublicadores.find(tp => tp.descripcion.toLowerCase() === repTipoVal);
            const id_tipo_publicador = repTipoObj ? repTipoObj.id : publicador.id_tipo_publicador || 1;

            const horas = parseInt(p.Horas) || 0;
            const notas = p.Notas ? String(p.Notas).trim() : null;
            const horas_SS = parseInt(p['Horas S. S. (PR)']) || 0;

            const params = [
                publicador.id, mes, mesEnviado, predico_en_el_mes, cursos_biblicos,
                id_tipo_publicador, horas, notas, horas_SS
            ];

            await sequelize.query(
                `INSERT INTO Informes (
                    id_publicador, mes, mes_enviado, predico_en_el_mes, cursos_biblicos,
                    id_tipo_publicador, horas, notas, horas_SS, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                 ON CONFLICT(id_publicador, mes) DO UPDATE SET
                    mes_enviado = excluded.mes_enviado,
                    predico_en_el_mes = excluded.predico_en_el_mes,
                    cursos_biblicos = excluded.cursos_biblicos,
                    id_tipo_publicador = excluded.id_tipo_publicador,
                    horas = excluded.horas,
                    notas = excluded.notas,
                    horas_SS = excluded.horas_SS,
                    updatedAt = datetime('now');`,
                {
                    type: QueryTypes.INSERT,
                    replacements: params
                }
            );
            infCount++;

            if (i % 10 === 0) {
                notify(55 + Math.round((i / jsonInf.length) * 25), `Informe importado para: ${p.Nombre}...`);
            }
        }
    }

    // ─── PART 3: ASISTENCIAS ───
    let asisCount = 0;
    const sheetAsis = workbook.Sheets['Asistencias'];
    if (sheetAsis) {
        notify(80, "Importando Asistencias...");
        const jsonAsis = XLSX.utils.sheet_to_json(sheetAsis);

        for (let i = 0; i < jsonAsis.length; i++) {
            const p = jsonAsis[i];

            if (!p.Fecha || String(p.Fecha).trim().toLowerCase() === 'total') continue;

            const fecha = parseExcelDate(p.Fecha);
            if (!fecha) continue;

            const asistentes = parseInt(p.Asistentes) || 0;
            const notas = p.Notas ? String(p.Notas).trim() : null;

            await sequelize.query(
                `INSERT INTO Asistencias (fecha, asistentes, notas, createdAt, updatedAt)
                 VALUES (?, ?, ?, datetime('now'), datetime('now'))
                 ON CONFLICT(fecha) DO UPDATE SET
                   asistentes = excluded.asistentes,
                   notas = excluded.notas,
                   updatedAt = datetime('now');`,
                {
                    type: QueryTypes.INSERT,
                    replacements: [fecha, asistentes, notas]
                }
            );
            asisCount++;

            if (i % 5 === 0) {
                notify(80 + Math.round((i / jsonAsis.length) * 15), `Asistencia importada: ${fecha}...`);
            }
        }
    }

    notify(100, "Carga finalizada con éxito.");
    
    return {
        success: true,
        publicadoresImportados: pubCount,
        informesImportados: infCount,
        asistenciasImportadas: asisCount
    };
};
