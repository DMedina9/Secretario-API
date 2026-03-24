import { sequelize } from '../common/models/Secretario.mjs'
import { Op, QueryTypes } from 'sequelize'
import * as fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import AdmZip from 'adm-zip';
import * as path from 'node:path';
import dayjs from 'dayjs';
import { getMesInforme } from '../secretario/controller.mjs';
// Import required utilities
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);

// Get the directory name from the file path
const __dirname = dirname(__filename);
const dataFields = {
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

    "Cursos 1": "902_20_Text_C_SanSerif",
    "Cursos 2": "902_21_Text_C_SanSerif",
    "Cursos 3": "902_22_Text_C_SanSerif",
    "Cursos 4": "902_23_Text_C_SanSerif",
    "Cursos 5": "902_24_Text_C_SanSerif",
    "Cursos 6": "902_25_Text_C_SanSerif",
    "Cursos 7": "902_26_Text_C_SanSerif",
    "Cursos 8": "902_27_Text_C_SanSerif",
    "Cursos 9": "902_28_Text_C_SanSerif",
    "Cursos 10": "902_29_Text_C_SanSerif",
    "Cursos 11": "902_30_Text_C_SanSerif",
    "Cursos 12": "902_31_Text_C_SanSerif",

    "Horas 1": "904_20_S21_Value",
    "Horas 2": "904_21_S21_Value",
    "Horas 3": "904_22_S21_Value",
    "Horas 4": "904_23_S21_Value",
    "Horas 5": "904_24_S21_Value",
    "Horas 6": "904_25_S21_Value",
    "Horas 7": "904_26_S21_Value",
    "Horas 8": "904_27_S21_Value",
    "Horas 9": "904_28_S21_Value",
    "Horas 10": "904_29_S21_Value",
    "Horas 11": "904_30_S21_Value",
    "Horas 12": "904_31_S21_Value",
    "Horas Total": "904_32_S21_Value",

    "Nota 1": "905_20_Text_SanSerif",
    "Nota 2": "905_21_Text_SanSerif",
    "Nota 3": "905_22_Text_SanSerif",
    "Nota 4": "905_23_Text_SanSerif",
    "Nota 5": "905_24_Text_SanSerif",
    "Nota 6": "905_25_Text_SanSerif",
    "Nota 7": "905_26_Text_SanSerif",
    "Nota 8": "905_27_Text_SanSerif",
    "Nota 9": "905_28_Text_SanSerif",
    "Nota 10": "905_29_Text_SanSerif",
    "Nota 11": "905_30_Text_SanSerif",
    "Nota 12": "905_31_Text_SanSerif",
    "Nota Total": "905_32_Text_SanSerif",

    "Participacion 1": "901_20_CheckBox",
    "Participacion 2": "901_21_CheckBox",
    "Participacion 3": "901_22_CheckBox",
    "Participacion 4": "901_23_CheckBox",
    "Participacion 5": "901_24_CheckBox",
    "Participacion 6": "901_25_CheckBox",
    "Participacion 7": "901_26_CheckBox",
    "Participacion 8": "901_27_CheckBox",
    "Participacion 9": "901_28_CheckBox",
    "Participacion 10": "901_29_CheckBox",
    "Participacion 11": "901_30_CheckBox",
    "Participacion 12": "901_31_CheckBox",
    "Auxiliar 1": "903_20_CheckBox",
    "Auxiliar 2": "903_21_CheckBox",
    "Auxiliar 3": "903_22_CheckBox",
    "Auxiliar 4": "903_23_CheckBox",
    "Auxiliar 5": "903_24_CheckBox",
    "Auxiliar 6": "903_25_CheckBox",
    "Auxiliar 7": "903_26_CheckBox",
    "Auxiliar 8": "903_27_CheckBox",
    "Auxiliar 9": "903_28_CheckBox",
    "Auxiliar 10": "903_29_CheckBox",
    "Auxiliar 11": "903_30_CheckBox",
    "Auxiliar 12": "903_31_CheckBox"
};

// Ruta del archivo PDF
const rutaPDF = path.resolve(
    __dirname,
    '..',
    'resources',
    'PDF',
    'S-21_S.pdf'
)
async function getS21Totales(anio = null, id_tipo_publicador = null, zip = null) {
    if (!zip && !id_tipo_publicador)
        zip = new AdmZip();
    const filtro = id_tipo_publicador ? ` where id = ${id_tipo_publicador}` : '';
    const Tipo_Publicador = await sequelize.query(`SELECT * FROM Tipos_Publicadores${filtro}`, { type: QueryTypes.SELECT });
    let bytes = null;
    let fileName = null;
    if (!anio) {
        const mesInforme = await getMesInforme();
        anio = mesInforme.getFullYear() + (mesInforme.getMonth() >= 8 ? 1 : 0);
    }
    for (let tipo_publicador of Tipo_Publicador) {
        const pdfDoc = await PDFDocument.load(fs.readFileSync(rutaPDF));
        const form = pdfDoc.getForm()

        // Rellenar campos del formulario
        form.getTextField(dataFields['Nombre']).setText(tipo_publicador.descripcion);

        if (tipo_publicador.descripcion === 'Precursor regular') form.getCheckBox(dataFields['Precursor regular']).check();
        else if (tipo_publicador.descripcion === 'Precursor especial') form.getCheckBox(dataFields['Precursor especial']).check();
        else if (tipo_publicador.descripcion === 'Misionero') form.getCheckBox(dataFields['Misionero']).check();

        form.getTextField(dataFields['Año de servicio']).setText(anio.toString());

        const Informes = await sequelize.query(`select mes, 1 as predico_en_el_mes, sum(i.cursos_biblicos) as cursos_biblicos, tp.descripcion as tipo_publicador, sum(horas) as horas, count(1) as notas,
				(cast(strftime('%m', mes) as integer) + 3) % 12 + 1 as iNumMes
			from Informes i
			left join Tipos_Publicadores tp
				on tp.id = i.id_tipo_publicador
			where i.predico_en_el_mes = 1
			and tp.id = ?
			and case when cast(strftime('%m', mes) as integer) > 8 then 1 else 0 end + cast(strftime('%Y', mes) as integer) = ${anio}
			group by mes, tp.descripcion;`, {
            replacements: [tipo_publicador.id],
            type: QueryTypes.SELECT
        });

        let totalHoras = 0;

        for (let informe of Informes) {
            const mesNumero = informe.iNumMes.toString();
            // Rellenar los campos del formulario con los datos del informe
            if (informe.predico_en_el_mes) form.getCheckBox(dataFields['Participacion ' + mesNumero]).check();
            if (informe.tipo_publicador === "Precursor auxiliar") form.getCheckBox(dataFields['Auxiliar ' + mesNumero]).check();
            if (informe.cursos_biblicos) form.getTextField(dataFields['Cursos ' + mesNumero]).setText(informe.cursos_biblicos.toString());
            if (informe.horas && (informe.tipo_publicador === "Precursor auxiliar" || informe.tipo_publicador === "Precursor regular")) {
                form.getTextField(dataFields['Horas ' + mesNumero]).setText(informe.horas.toString());
                totalHoras += informe.horas;
            }

            if (informe.notas) form.getTextField(dataFields['Nota ' + mesNumero]).setText(informe.notas.toString());
        }
        if (totalHoras)
            form.getTextField(dataFields["Horas Total"]).setText(totalHoras.toString());

        // Guardar el PDF modificado
        await pdfDoc.save({ useObjectStreams: false });
        bytes = await pdfDoc.save({ useObjectStreams: true });
        //const pdfBytes = await pdfDoc.save();
        fileName = `S-21-S - ${anio} - ${tipo_publicador.descripcion}.pdf`;
        if (zip) zip.addFile(`01 Tarjetas de totales mensuales/${fileName}`, bytes, `${tipo_publicador.descripcion}`);
    }
    if (!zip) return { success: true, bytes, fileName };
    return { success: true, zip, fileName: "S-21-S - " + anio + " - Totales mensuales.zip" };
}
// Generar y exportar el PDF rellenado
async function getS21(anio = null, id_publicador = null, zip = null) {
    if (!zip && !id_publicador)
        zip = new AdmZip();
    if (!id_publicador) {
        const result = await getS21Totales(anio, null, zip);
        if (!result.success) return result;
        zip = result.zip;
    }
    let bytes = null;
    let fileName = null;
    const filtro = id_publicador ? ` where p.id = ${id_publicador}` : '';
    // Leer todos los publicadores
    const Publicadores = await sequelize.query(`select p.id, nombre, apellidos, fecha_nacimiento, fecha_bautismo, grupo, case sup_grupo when 1 then 'Sup' when 2 then 'Aux' else null end as sup_grupo,
		sexo, pr.descripcion as privilegio, tp.descripcion as tipo_publicador, ungido, calle, num, colonia, telefono_fijo, telefono_movil, contacto_emergencia, tel_contacto_emergencia, correo_contacto_emergencia,
        (select max(mes) from Informes where id_publicador = p.id and predico_en_el_mes = 1) as mes_informe
		from Publicadores p
		left join Privilegios pr
			on pr.id = p.id_privilegio
		left join Tipos_Publicadores tp
			on tp.id = p.id_tipo_publicador
		${filtro}`, {
        type: QueryTypes.SELECT
    });
    if (Publicadores.length === 0) {
        return { success: false, error: "No se encontraron publicadores" };
    }
    for (let publicador of Publicadores) {
        const pdfDoc = await PDFDocument.load(fs.readFileSync(rutaPDF));
        //pdfDoc.registerFontkit(fontkit);
        const form = pdfDoc.getForm()

        // Rellenar campos del formulario
        form.getTextField(dataFields['Nombre']).setText(publicador.nombre + ' ' + publicador.apellidos);
        if (publicador.fecha_nacimiento) form.getTextField(dataFields['Fecha de nacimiento']).setText(getDateFormat(publicador.fecha_nacimiento));
        if (publicador.fecha_bautismo) form.getTextField(dataFields['Fecha de bautismo']).setText(getDateFormat(publicador.fecha_bautismo));

        if (publicador.sexo === 'H') form.getCheckBox(dataFields['Hombre']).check();
        else if (publicador.sexo === 'M') form.getCheckBox(dataFields['Mujer']).check();

        if (publicador.ungido) form.getCheckBox(dataFields['Ungido']).check();
        else form.getCheckBox(dataFields['Otras ovejas']).check();

        if (publicador.privilegio === 'Anciano') form.getCheckBox(dataFields['Anciano']).check();
        else if (publicador.privilegio === 'Siervo ministerial') form.getCheckBox(dataFields['Siervo ministerial']).check();

        if (publicador.tipo_publicador === 'Precursor regular') form.getCheckBox(dataFields['Precursor regular']).check();
        else if (publicador.tipo_publicador === 'Precursor especial') form.getCheckBox(dataFields['Precursor especial']).check();
        else if (publicador.tipo_publicador === 'Misionero') form.getCheckBox(dataFields['Misionero']).check();

        let anio_informe = anio;
        if (anio_informe == null) {
            const mes = publicador.mes_informe ? dayjs(publicador.mes_informe).toDate() : await getMesInforme();
            anio_informe = mes.getFullYear() + (mes.getMonth() >= 8 ? 1 : 0);
        }
        form.getTextField(dataFields['Año de servicio']).setText(anio_informe.toString());

        let estatus;
        const Informes = await sequelize.query(`select p.nombre || ' ' || p.apellidos as publicador,
				mes, predico_en_el_mes, i.cursos_biblicos,
				tp.descripcion as tipo_publicador,
				horas,
				notas,
				horas_SS,
				(cast(strftime('%m', mes) as integer) + 3) % 12 + 1 as iNumMes,
				case when tp.descripcion = 'Precursor regular' then max(0, min(55 - horas, ifnull(horas_SS, 0))) else null end as horas_Acred,
				case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-6 months') and date(i.mes, '-1 months')) > 0 then 'Activo' else 'Inactivo' end as EstatusAnterior,
				case when (select sum(predico_en_el_mes) from Informes a where id_publicador = i.id_publicador and date(mes) between date(i.mes, '-5 months') and date(i.mes)) > 0 then 'Activo' else 'Inactivo' end as Estatus
			from Informes i
			left join Publicadores p
				on i.id_Publicador = p.id
			left join Tipos_Publicadores tp
				on tp.id = i.id_tipo_publicador
			where p.id = ?
			and case when cast(strftime('%m', mes) as integer) > 8 then 1 else 0 end + cast(strftime('%Y', mes) as integer) = ${anio_informe};`, {
            replacements: [publicador.id],
            type: QueryTypes.SELECT
        });

        let totalHoras = 0;

        for (let informe of Informes) {
            const mesNumero = informe.iNumMes.toString();
            estatus = informe.Estatus;
            // Rellenar los campos del formulario con los datos del informe
            if (informe.predico_en_el_mes) form.getCheckBox(dataFields['Participacion ' + mesNumero]).check();
            if (informe.tipo_publicador === "Precursor auxiliar") form.getCheckBox(dataFields['Auxiliar ' + mesNumero]).check();
            if (informe.cursos_biblicos) {
                const campoNumero = form.getTextField(dataFields['Cursos ' + mesNumero]);
                campoNumero.setText(informe.cursos_biblicos.toString());
            }
            if (informe.horas && (informe.tipo_publicador === "Precursor auxiliar" || informe.tipo_publicador === "Precursor regular")) {
                const campoNumero = form.getTextField(dataFields['Horas ' + mesNumero]);
                campoNumero.setText(informe.horas.toString());
                totalHoras += informe.horas;
            }
            if (informe.Estatus && informe.EstatusAnterior && informe.Estatus !== informe.EstatusAnterior && !informe.notas)
                informe.notas = informe.Estatus == "Inactivo" ? "Queda inactivo" : anio == 2024 && mesNumero == "1" ? "" : "Vuelve a estar activo";

            if (informe.notas)
                form.getTextField(dataFields['Nota ' + mesNumero]).setText(informe.notas);
        }
        if (totalHoras) {
            form.getTextField(dataFields["Horas Total"]).setText(totalHoras.toString());
        }

        // Guardar el PDF modificado
        await pdfDoc.save({ useObjectStreams: false });
        bytes = await pdfDoc.save({ useObjectStreams: true });

        let dir;
        if (estatus === "Activo")
            dir = `02 Activos/${(publicador.tipo_publicador === 'Precursor regular' ? "01 Precursores regulares" : "02 Publicadores por grupo/Grupo " + publicador.grupo)}`;
        else
            dir = `03 Inactivos (Por grupo de servicio)/Grupo ${publicador.grupo}`;

        fileName = `S-21-S - ${anio_informe} - ${publicador.apellidos}, ${publicador.nombre}.pdf`;
        const filePath = `${dir}/${fileName}`;
        if (zip) zip.addFile(filePath, bytes, `${publicador.apellidos}, ${publicador.nombre}`);
    }
    if (!zip) return { success: true, bytes, fileName };
    if (!anio) {
        const mesInforme = await getMesInforme();
        anio = mesInforme.getFullYear() + (mesInforme.getMonth() >= 8 ? 1 : 0);
    }
    return { success: true, zip, fileName: "S-21-S - " + anio + " - Tarjetas de publicadores.zip" };
}
const calcularPromedio = (item) =>
    item.num_reuniones ? item.asistencia / item.num_reuniones : 0

// Función para calcular el promedio de los promedios
const promedioDePromedios = (matriz) => {
    if (!Array.isArray(matriz) || matriz.length === 0) {
        return 0 // O manejar el caso según sea necesario
    }

    // Calcular el promedio de cada subarreglo
    const promedios = matriz.map((item) => {
        return calcularPromedio(item)
    })

    // Calcular el promedio de los promedios
    return promedios.reduce((a, b) => a + b, 0) / promedios.length
}

const getS88Data = async (anio, type) => {
    // Validar año
    if (!anio || isNaN(anio) || anio < 2020) {
        return { success: false, error: 'Año inválido' }
    }
    try {
        const rows = await sequelize.query(
            `select
                    (month + 3) % 12 + 1 as id,
                    month, num_reuniones, asistencia
                from (
                    SELECT
                        CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END as type,
                        CAST(strftime('%m', fecha) AS INTEGER) AS month,
                        CAST(strftime('%Y', fecha) AS INTEGER) AS year,
                        COUNT(1) AS num_reuniones,
                        SUM(asistentes) AS asistencia
                    FROM Asistencias
                    where asistentes is not null
                    GROUP BY strftime('%Y-%m', fecha), CASE WHEN CAST(STRFTIME('%w', fecha) AS INTEGER) IN (0,6) THEN 'FS' ELSE 'ES' END
                ) a
                WHERE case when month > 8 then 1 else 0 end + year = ?
                and type = ?;
`,
            { replacements: [anio, type], type: QueryTypes.SELECT }
        )
        return { success: true, data: rows }
    } catch (error) {
        console.error('Database query error:', error)
        return { success: false, error: error.message }
    }
}

// Generar y exportar el PDF rellenado
async function getS88(anio) {
    const rutaPDF = path.resolve(
        __dirname,
        '..',
        'resources',
        'PDF',
        'S-88_S.pdf'
    )
    const pdfDoc = await PDFDocument.load(fs.readFileSync(rutaPDF));
    //pdfDoc.registerFontkit(fontkit);
    const form = pdfDoc.getForm()
    for (let i = 1; i < 5; i++) {
        let year;
        let type;
        switch (i) {
            case 1:
                year = anio - 1;
                type = "ES";
                break;
            case 2:
                year = anio * 1;
                type = "ES";
                break;
            case 3:
                year = anio - 1;
                type = "FS"
                break;
            case 4:
                year = anio * 1;
                type = "FS"
                break;
        }
        const { success, data } = await getS88Data(year, type);
        const rows = data;
        if (!success || rows.length === 0) continue;

        for (let row of rows) {
            // Rellenar campos del formulario
            form.getTextField(`Service Year_${i}`).setText(year.toString());
            if (row.num_reuniones) form.getTextField(`${i}-Meeting_${row.id}`).setText(row.num_reuniones.toString());
            if (row.asistencia) form.getTextField(`${i}-Attendance_${row.id}`).setText(row.asistencia.toString());

            if (row.num_reuniones && row.asistencia) form.getTextField(`${i}-Average_${row.id}`).setText((row.asistencia / row.num_reuniones).toFixed(2));
        }
        const average = promedioDePromedios(rows)
        if (average)
            form.getTextField(`${i}-Average_Total`).setText(average.toFixed(2));
    }
    // Guardar el PDF modificado
    await pdfDoc.save({ useObjectStreams: false });
    const bytes = await pdfDoc.save({ useObjectStreams: true });

    return { success: true, fileName: `S-88-S - ${anio - 1} - ${anio}.pdf`, bytes };
}

function getDateFormat(date) {
    date = date.substring(0, 10);
    const dateParts = date.split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    return `${day}/${month}/${year}`;
}

export { getS21, getS21Totales, getS88 };
//GenerarS21(2024).catch((err) => console.error(err));
//GenerarS21(2025).catch((err) => console.error(err));