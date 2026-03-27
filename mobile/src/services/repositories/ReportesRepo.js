import { Publicadores, Informes, Asistencias, Configuracion, Privilegio, TipoPublicador, sequelize, QueryTypes } from '../models';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import dayjs from 'dayjs';

// === Utility to get Base64 of bundled PDF ===
async function getBundledPdfBase64(docType) {
    let assetModule;
    if (docType === 'S21') {
        assetModule = require('../../../assets/PDF/S-21_S.pdf');
    } else {
        assetModule = require('../../../assets/PDF/S-88_S.pdf');
    }

    const asset = Asset.fromModule(assetModule);
    await asset.downloadAsync();
    return await FileSystem.readAsStringAsync(asset.localUri, { encoding: 'base64' });
}

// === Data fields mapping for S-21 ===
const dataFieldsS21 = {
    "Nombre": "900_1_Text_SanSerif",
    "Fecha de nacimiento": "900_2_Text_SanSerif",
    "Hombre": "900_3_CheckBox",
    "Mujer": "900_4_CheckBox",
    "Fecha de bautismo": "900_5_Text_SanSerif",
    "Otras ovejas": "900_6_CheckBox",
    "Ungido": "900_7_CheckBox",
    "Anciano": "900_8_CheckBox",
    "Siervo ministerial": "900_9_CheckBox",
    "Precursor regular": "900_10_CheckBox",
    "Precursor especial": "900_11_CheckBox",
    "Misionero": "900_12_CheckBox",
    "Año de servicio": "900_13_Text_C_SanSerif",

    "Cursos 1": "902_20_Text_C_SanSerif", "Cursos 2": "902_21_Text_C_SanSerif", "Cursos 3": "902_22_Text_C_SanSerif", "Cursos 4": "902_23_Text_C_SanSerif", "Cursos 5": "902_24_Text_C_SanSerif", "Cursos 6": "902_25_Text_C_SanSerif", "Cursos 7": "902_26_Text_C_SanSerif", "Cursos 8": "902_27_Text_C_SanSerif", "Cursos 9": "902_28_Text_C_SanSerif", "Cursos 10": "902_29_Text_C_SanSerif", "Cursos 11": "902_30_Text_C_SanSerif", "Cursos 12": "902_31_Text_C_SanSerif",
    "Horas 1": "904_20_S21_Value", "Horas 2": "904_21_S21_Value", "Horas 3": "904_22_S21_Value", "Horas 4": "904_23_S21_Value", "Horas 5": "904_24_S21_Value", "Horas 6": "904_25_S21_Value", "Horas 7": "904_26_S21_Value", "Horas 8": "904_27_S21_Value", "Horas 9": "904_28_S21_Value", "Horas 10": "904_29_S21_Value", "Horas 11": "904_30_S21_Value", "Horas 12": "904_31_S21_Value", "Horas Total": "904_32_S21_Value",
    "Nota 1": "905_20_Text_SanSerif", "Nota 2": "905_21_Text_SanSerif", "Nota 3": "905_22_Text_SanSerif", "Nota 4": "905_23_Text_SanSerif", "Nota 5": "905_24_Text_SanSerif", "Nota 6": "905_25_Text_SanSerif", "Nota 7": "905_26_Text_SanSerif", "Nota 8": "905_27_Text_SanSerif", "Nota 9": "905_28_Text_SanSerif", "Nota 10": "905_29_Text_SanSerif", "Nota 11": "905_30_Text_SanSerif", "Nota 12": "905_31_Text_SanSerif", "Nota Total": "905_32_Text_SanSerif",
    "Participacion 1": "901_20_CheckBox", "Participacion 2": "901_21_CheckBox", "Participacion 3": "901_22_CheckBox", "Participacion 4": "901_23_CheckBox", "Participacion 5": "901_24_CheckBox", "Participacion 6": "901_25_CheckBox", "Participacion 7": "901_26_CheckBox", "Participacion 8": "901_27_CheckBox", "Participacion 9": "901_28_CheckBox", "Participacion 10": "901_29_CheckBox", "Participacion 11": "901_30_CheckBox", "Participacion 12": "901_31_CheckBox",
    "Auxiliar 1": "903_20_CheckBox", "Auxiliar 2": "903_21_CheckBox", "Auxiliar 3": "903_22_CheckBox", "Auxiliar 4": "903_23_CheckBox", "Auxiliar 5": "903_24_CheckBox", "Auxiliar 6": "903_25_CheckBox", "Auxiliar 7": "903_26_CheckBox", "Auxiliar 8": "903_27_CheckBox", "Auxiliar 9": "903_28_CheckBox", "Auxiliar 10": "903_29_CheckBox", "Auxiliar 11": "903_30_CheckBox", "Auxiliar 12": "903_31_CheckBox"
};

function getDateFormat(dateString) {
    if (!dateString) return '';
    const date = dateString.substring(0, 10);
    const dateParts = date.split('-');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
}

const calcularPromedio = (item) => item.num_reuniones ? item.asistencia / item.num_reuniones : 0;
const promedioDePromedios = (matriz) => {
    if (!Array.isArray(matriz) || matriz.length === 0) return 0;
    const promedios = matriz.map(item => calcularPromedio(item));
    return promedios.reduce((a, b) => a + b, 0) / promedios.length;
};

// =====================================================================================
// S-21 Totales Offline
// =====================================================================================
export async function getS21TotalesLocal(anio, id_tipo_publicador, zip) {
    let zipObj = zip || new JSZip();
    const filtro = id_tipo_publicador ? ` WHERE id = ${id_tipo_publicador}` : '';
    const Tipo_Publicador = await sequelize.query(`SELECT * FROM Tipos_Publicadores${filtro}`, { type: QueryTypes.SELECT });

    let b64Result = null;
    const base64Template = await getBundledPdfBase64('S21');

    for (let tipo of Tipo_Publicador) {
        const pdfDoc = await PDFDocument.load(base64Template);
        const form = pdfDoc.getForm();

        form.getTextField(dataFieldsS21['Nombre']).setText(tipo.descripcion);

        if (tipo.descripcion === 'Precursor regular') form.getCheckBox(dataFieldsS21['Precursor regular']).check();
        else if (tipo.descripcion === 'Precursor especial') form.getCheckBox(dataFieldsS21['Precursor especial']).check();
        else if (tipo.descripcion === 'Misionero') form.getCheckBox(dataFieldsS21['Misionero']).check();

        if (anio) form.getTextField(dataFieldsS21['Año de servicio']).setText(anio.toString());

        const Informes = await sequelize.query(
            `SELECT SUBSTR(mes, 1, 10) AS mes_real, 1 AS predico_en_el_mes, SUM(i.cursos_biblicos) AS cursos_biblicos, tp.descripcion AS tipo_publicador, SUM(horas) AS horas, COUNT(1) AS notas,
                   (CAST(STRFTIME('%m', SUBSTR(mes, 1, 10)) AS INTEGER) + 3) % 12 + 1 AS iNumMes
            FROM Informes i
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            WHERE i.predico_en_el_mes = 1 AND tp.id = ?
              AND CASE WHEN CAST(STRFTIME('%m', SUBSTR(mes, 1, 10)) AS INTEGER) > 8 THEN 1 ELSE 0 END + CAST(STRFTIME('%Y', SUBSTR(mes, 1, 10)) AS INTEGER) = ?
            GROUP BY SUBSTR(mes, 1, 10), tp.descripcion;`,
            { replacements: [tipo.id, anio], type: QueryTypes.SELECT }
        );

        let totalHoras = 0;
        for (let informe of Informes) {
            const num = informe.iNumMes.toString();
            if (informe.predico_en_el_mes) form.getCheckBox(dataFieldsS21['Participacion ' + num]).check();
            if (informe.tipo_publicador === "Precursor auxiliar") form.getCheckBox(dataFieldsS21['Auxiliar ' + num]).check();
            if (informe.cursos_biblicos) form.getTextField(dataFieldsS21['Cursos ' + num]).setText(informe.cursos_biblicos.toString());
            if (informe.horas && (informe.tipo_publicador === "Precursor auxiliar" || informe.tipo_publicador === "Precursor regular")) {
                form.getTextField(dataFieldsS21['Horas ' + num]).setText(informe.horas.toString());
                totalHoras += informe.horas;
            }
            if (informe.notas) form.getTextField(dataFieldsS21['Nota ' + num]).setText(informe.notas.toString());
        }
        if (totalHoras) form.getTextField(dataFieldsS21["Horas Total"]).setText(totalHoras.toString());

        const bytes = await pdfDoc.saveAsBase64({ dataUri: false });
        b64Result = bytes;
        if (zipObj) zipObj.file(`01 Tarjetas de totales mensuales/S-21-S - ${anio} - ${tipo.descripcion}.pdf`, bytes, { base64: true });
    }

    if (!zip) return { success: true, base64: b64Result };
    return { success: true, zip: zipObj };
}

// =====================================================================================
// S-21 Individual Offline
// =====================================================================================
export async function getS21Local(anio, id_publicador) {
    let zipObj = new JSZip();

    if (!id_publicador) {
        const result = await getS21TotalesLocal(anio, null, zipObj);
        if (!result.success) return result;
        zipObj = result.zip;
    }

    const filtro = id_publicador ? ` WHERE p.id = ${id_publicador}` : '';
    const Publicadores = await sequelize.query(
        `SELECT p.id, nombre, apellidos, fecha_nacimiento, fecha_bautismo, grupo,
                CASE sup_grupo WHEN 1 THEN 'Sup' WHEN 2 THEN 'Aux' ELSE NULL END AS sup_grupo,
                sexo, pr.descripcion AS privilegio, tp.descripcion AS tipo_publicador, ungido,
                (SELECT SUBSTR(MAX(mes), 1, 10) FROM Informes WHERE id_publicador = p.id AND predico_en_el_mes = 1) AS mes_informe
        FROM Publicadores p
        LEFT JOIN Privilegios pr ON pr.id = p.id_privilegio
        LEFT JOIN Tipos_Publicadores tp ON tp.id = p.id_tipo_publicador
        ${filtro}`,
        { type: QueryTypes.SELECT }
    );

    if (Publicadores.length === 0) return { success: false, error: "No se encontraron publicadores" };

    const base64Template = await getBundledPdfBase64('S21');
    let b64Result = null;

    for (let pub of Publicadores) {
        const pdfDoc = await PDFDocument.load(base64Template);
        const form = pdfDoc.getForm();

        form.getTextField(dataFieldsS21['Nombre']).setText(`${pub.nombre} ${pub.apellidos}`);
        if (pub.fecha_nacimiento) form.getTextField(dataFieldsS21['Fecha de nacimiento']).setText(getDateFormat(pub.fecha_nacimiento));
        if (pub.fecha_bautismo) form.getTextField(dataFieldsS21['Fecha de bautismo']).setText(getDateFormat(pub.fecha_bautismo));
        if (pub.sexo === 'H') form.getCheckBox(dataFieldsS21['Hombre']).check();
        else if (pub.sexo === 'M') form.getCheckBox(dataFieldsS21['Mujer']).check();

        if (pub.ungido) form.getCheckBox(dataFieldsS21['Ungido']).check();
        else form.getCheckBox(dataFieldsS21['Otras ovejas']).check();

        if (pub.privilegio === 'Anciano') form.getCheckBox(dataFieldsS21['Anciano']).check();
        else if (pub.privilegio === 'Siervo ministerial') form.getCheckBox(dataFieldsS21['Siervo ministerial']).check();

        if (pub.tipo_publicador === 'Precursor regular') form.getCheckBox(dataFieldsS21['Precursor regular']).check();
        else if (pub.tipo_publicador === 'Precursor especial') form.getCheckBox(dataFieldsS21['Precursor especial']).check();
        else if (pub.tipo_publicador === 'Misionero') form.getCheckBox(dataFieldsS21['Misionero']).check();

        form.getTextField(dataFieldsS21['Año de servicio']).setText(anio.toString());

        let estatus;
        const Informes = await sequelize.query(
            `SELECT SUBSTR(mes, 1, 10) AS mes_real, predico_en_el_mes, cursos_biblicos, tp.descripcion AS tipo_publicador,
                    horas, notas, horas_SS,
                    (CAST(STRFTIME('%m', SUBSTR(mes, 1, 10)) AS INTEGER) + 3) % 12 + 1 AS iNumMes,
                    CASE WHEN (SELECT SUM(predico_en_el_mes) FROM Informes a WHERE id_publicador = i.id_publicador AND DATE(SUBSTR(mes, 1, 10)) BETWEEN DATE(SUBSTR(i.mes, 1, 10), '-6 months') AND DATE(SUBSTR(i.mes, 1, 10), '-1 months')) > 0 THEN 'Activo' ELSE 'Inactivo' END AS EstatusAnterior,
                    CASE WHEN (SELECT SUM(predico_en_el_mes) FROM Informes a WHERE id_publicador = i.id_publicador AND DATE(SUBSTR(mes, 1, 10)) BETWEEN DATE(SUBSTR(i.mes, 1, 10), '-5 months') AND DATE(SUBSTR(i.mes, 1, 10))) > 0 THEN 'Activo' ELSE 'Inactivo' END AS Estatus
             FROM Informes i
             LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
             WHERE i.id_publicador = ?
               AND CASE WHEN CAST(STRFTIME('%m', SUBSTR(mes, 1, 10)) AS INTEGER) > 8 THEN 1 ELSE 0 END + CAST(STRFTIME('%Y', SUBSTR(mes, 1, 10)) AS INTEGER) = ?;`,
            { replacements: [pub.id, anio], type: QueryTypes.SELECT }
        );

        let totalHoras = 0;
        for (let informe of Informes) {
            const num = informe.iNumMes.toString();
            estatus = informe.Estatus;

            if (informe.predico_en_el_mes) form.getCheckBox(dataFieldsS21['Participacion ' + num]).check();
            if (informe.tipo_publicador === "Precursor auxiliar") form.getCheckBox(dataFieldsS21['Auxiliar ' + num]).check();
            if (informe.cursos_biblicos) form.getTextField(dataFieldsS21['Cursos ' + num]).setText(informe.cursos_biblicos.toString());
            if (informe.horas && (informe.tipo_publicador === "Precursor auxiliar" || informe.tipo_publicador === "Precursor regular")) {
                form.getTextField(dataFieldsS21['Horas ' + num]).setText(informe.horas.toString());
                totalHoras += informe.horas;
            }

            let notaEstatus = '';
            if (informe.Estatus && informe.EstatusAnterior && informe.Estatus !== informe.EstatusAnterior && !informe.notas) {
                notaEstatus = informe.Estatus === "Inactivo" ? "Queda inactivo" : "Vuelve a estar activo";
            }
            if (informe.notas) form.getTextField(dataFieldsS21['Nota ' + num]).setText(informe.notas);
            else if (notaEstatus) form.getTextField(dataFieldsS21['Nota ' + num]).setText(notaEstatus);
        }

        if (totalHoras) form.getTextField(dataFieldsS21["Horas Total"]).setText(totalHoras.toString());

        b64Result = await pdfDoc.saveAsBase64({ dataUri: false });

        let dir;
        if (estatus === "Activo") {
            dir = `02 Activos/${(pub.tipo_publicador === 'Precursor regular' ? "01 Precursores regulares" : "02 Publicadores por grupo/Grupo " + pub.grupo)}`;
        } else {
            dir = `03 Inactivos (Por grupo de servicio)/Grupo ${pub.grupo}`;
        }
        zipObj.file(`${dir}/S-21-S - ${anio} - ${pub.apellidos}, ${pub.nombre}.pdf`, b64Result, { base64: true });
    }

    if (id_publicador) {
        return { success: true, base64: b64Result };
    } else {
        const content = await zipObj.generateAsync({ type: 'base64' });
        return { success: true, base64: content, isZip: true };
    }
}

// =====================================================================================
// S-88 Offline
// =====================================================================================
export async function getS88Local(anio) {
    if (!anio || isNaN(anio) || anio < 2020) return { success: false, error: 'Año inválido' };

    const base64Template = await getBundledPdfBase64('S88');
    const pdfDoc = await PDFDocument.load(base64Template);
    const form = pdfDoc.getForm();

    for (let i = 1; i < 5; i++) {
        let year = (i === 1 || i === 3) ? anio - 1 : anio;
        let type = (i === 1 || i === 2) ? 'ES' : 'FS';

        const rows = await sequelize.query(
            `SELECT (month + 3) % 12 + 1 AS id, month, num_reuniones, asistencia
             FROM (
                 SELECT CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END AS type,
                        CAST(STRFTIME('%m', SUBSTR(fecha, 1, 10)) AS INTEGER) AS month,
                        CAST(STRFTIME('%Y', SUBSTR(fecha, 1, 10)) AS INTEGER) AS year,
                        COUNT(1) AS num_reuniones,
                        SUM(asistentes) AS asistencia
                 FROM Asistencias
                 WHERE asistentes IS NOT NULL
                 GROUP BY STRFTIME('%Y-%m', SUBSTR(fecha, 1, 10)), CASE WHEN CAST(STRFTIME('%w', SUBSTR(fecha, 1, 10)) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
             ) a
             WHERE CASE WHEN month > 8 THEN 1 ELSE 0 END + year = ? AND type = ?;`,
            { replacements: [year, type], type: QueryTypes.SELECT }
        );

        if (!rows || rows.length === 0) continue;

        form.getTextField(`Service Year_${i}`).setText(year.toString());
        for (let row of rows) {
            if (row.num_reuniones) form.getTextField(`${i}-Meeting_${row.id}`).setText(row.num_reuniones.toString());
            if (row.asistencia) form.getTextField(`${i}-Attendance_${row.id}`).setText(row.asistencia.toString());
            if (row.num_reuniones && row.asistencia) {
                form.getTextField(`${i}-Average_${row.id}`).setText((row.asistencia / row.num_reuniones).toFixed(2));
            }
        }
        const average = promedioDePromedios(rows);
        if (average) form.getTextField(`${i}-Average_Total`).setText(average.toFixed(2));
    }

    const b64Result = await pdfDoc.saveAsBase64({ dataUri: false });
    return { success: true, base64: b64Result };
}

// =====================================================================================
// Reporte General Excel Offline
// =====================================================================================
import * as XLSX from 'xlsx';

export async function getReporteGeneralLocal() {
    try {
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
            ORDER BY grupo, apellidos, nombre
        `, { type: QueryTypes.SELECT })

        const informes = await sequelize.query(`
            SELECT
                p.apellidos || ', ' || p.nombre AS Nombre,
                tp.descripcion AS 'Tipo Publicador',
                i.mes AS Mes,
                i.mes_enviado AS 'Mes enviado',
                CASE i.predico_en_el_mes WHEN 1 THEN 'TRUE' WHEN 0 THEN 'FALSE' ELSE '' END AS 'Predicó en el mes',
                i.cursos_biblicos AS 'Cursos bíblicos',
                i.horas AS Horas,
                i.notas AS Notas,
                i.horas_SS AS 'Horas S. S. (PR)'
            FROM Informes i
            LEFT JOIN Publicadores p ON p.id = i.id_publicador
            LEFT JOIN Tipos_Publicadores tp ON tp.id = i.id_tipo_publicador
            ORDER BY i.mes DESC, p.apellidos, p.nombre
        `, { type: QueryTypes.SELECT })

        const asistencias = await sequelize.query(`
            SELECT
                fecha AS Fecha,
                asistentes AS Asistentes,
                notas AS Notas
            FROM Asistencias
            ORDER BY fecha DESC
        `, { type: QueryTypes.SELECT })

        const wb = XLSX.utils.book_new();

        const wsPub = XLSX.utils.json_to_sheet(publicadores);
        XLSX.utils.book_append_sheet(wb, wsPub, "Publicadores");

        const wsInf = XLSX.utils.json_to_sheet(informes);
        XLSX.utils.book_append_sheet(wb, wsInf, "Informes");

        const wsAsis = XLSX.utils.json_to_sheet(asistencias);
        XLSX.utils.book_append_sheet(wb, wsAsis, "Asistencias");

        const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        return { success: true, base64: b64 };
    } catch (e) {
        return { success: false, error: e.message };
    }
}
