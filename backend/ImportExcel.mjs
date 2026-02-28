import { sequelize } from './common/models/Secretario.mjs'
import { Op, QueryTypes } from 'sequelize'
import xlsx from 'xlsx'

const insertPrivilegios = async () => {
    // Insertar privilegios
    for (let privilegio of ['Anciano', 'Siervo ministerial']) {
        await sequelize.query(`INSERT OR IGNORE INTO Privilegios (descripcion) VALUES (?)`, {
            type: QueryTypes.INSERT,
            replacements: [privilegio]
        })
    }
    return { success: true, message: 'Importado Privilegios' }
}

const insertTipoPublicador = async () => {
    // Insertar tipos de publicador
    for (let tipo_Publicador of ['Publicador', 'Precursor regular', 'Precursor auxiliar']) {
        await sequelize.query(`INSERT OR IGNORE INTO Tipos_Publicadores (descripcion) VALUES (?)`, {
            type: QueryTypes.INSERT,
            replacements: [tipo_Publicador]
        })
    }
    return { success: true, message: 'Importado Tipos de Publicador' }
}

const insertPublicadores = async ({
    workbook,
    Privilegio,
    Tipo_Publicador,
    filePath,
    showMessage
}) => {
    if (!workbook && !filePath)
        return { success: false, message: 'No se proporcionó workbook ni filePath' }

    if (!workbook) {
        try {
            workbook = xlsx.readFile(filePath, { cellDates: true })
        } catch (err) {
            return { success: false, message: 'Error al leer el archivo: ' + err.message }
        }
    }

    const sheet = workbook.Sheets['Publicadores']
    if (!sheet) return { success: false, message: 'No se encontró la hoja "Publicadores"' }

    if (!Privilegio) {
        await insertPrivilegios()
        Privilegio = await sequelize.query(`select * from Privilegios`, {
            type: QueryTypes.SELECT
        })
    }

    if (!Tipo_Publicador) {
        await insertTipoPublicador()
        Tipo_Publicador = await sequelize.query(`select * from Tipos_Publicadores`, {
            type: QueryTypes.SELECT
        })
    }

    let count = 0
    try {
        // Importar publicadores
        const jsonPublicadores = xlsx.utils.sheet_to_json(sheet)
        for (let p of jsonPublicadores) {
            let nombre =
                p.Nombre && p.Nombre.indexOf(',') !== -1
                    ? p.Nombre.substring(p.Nombre.indexOf(',') + 2)
                    : p.Nombre
            let apellidos =
                p.Nombre && p.Nombre.indexOf(',') !== -1
                    ? p.Nombre.substring(0, p.Nombre.indexOf(','))
                    : ''
            if (nombre == 'Total') continue // Ignorar filas de totales

            let tipo_publicador = Tipo_Publicador.find(
                (tp) => tp.descripcion == p['Tipo Publicador']
            )
            let privilegio = Privilegio.find((pr) => pr.descripcion == p.Privilegio)
            let params = [
                nombre,
                apellidos,
                p['Fecha de nacimiento']?.toISOString().substring(0, 10),
                p['Fecha de bautismo']?.toISOString().substring(0, 10),
                p.Grupo,
                p['Sup. Grupo'] === 'Sup' ? 1 : p['Sup. Grupo'] === 'Aux' ? 2 : 0,
                p.Sexo?.substring(0, 1),
                privilegio?.id,
                tipo_publicador?.id,
                p.Ungido ? 1 : 0,
                p.Calle,
                p.Núm,
                p.Colonia,
                p['Teléfono fijo'],
                p['Teléfono móvil'],
                p['Contacto de emergencia'],
                p['Tel. Contacto de emergencia'],
                p['Correo Contacto de emergencia']
            ]
            await sequelize.query(
                `insert or ignore into Publicadores(
					nombre, apellidos, fecha_nacimiento, fecha_bautismo,
					grupo, sup_grupo, sexo, id_privilegio, id_tipo_publicador, ungido, calle, num, colonia,
					telefono_fijo, telefono_movil, contacto_emergencia, tel_contacto_emergencia, correo_contacto_emergencia
				) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
					correo_contacto_emergencia = excluded.correo_contacto_emergencia;`,
                {
                    type: QueryTypes.INSERT,
                    replacements: params
                }
            )
            count++
            if (showMessage)
                showMessage({
                    progress: Math.round((100 * count) / jsonPublicadores.length),
                    message: `Publicador importado: ${nombre} ${apellidos}...`
                })
        }
    } catch (e) {
        return { success: false, message: e.toString() }
    }
    return { success: true, message: `Publicadores importados: ${count}` }
}

const insertInformes = async ({
    workbook,
    Privilegio,
    Tipo_Publicador,
    Publicadores,
    filePath,
    showMessage
}) => {
    if (!workbook && !filePath)
        return { success: false, message: 'No se proporcionó workbook ni filePath' }

    if (!workbook) {
        try {
            workbook = xlsx.readFile(filePath, { cellDates: true })
        } catch (err) {
            return { success: false, message: 'Error al leer el archivo: ' + err.message }
        }
    }

    const sheet = workbook.Sheets['Informes']
    if (!sheet) return { success: false, message: 'No se encontró la hoja "Informes"' }

    if (!Tipo_Publicador) {
        await insertTipoPublicador()
        Tipo_Publicador = await sequelize.query(`select * from Tipos_Publicadores`, {
            type: QueryTypes.SELECT
        })
    }

    if (!Publicadores) {
        await insertPublicadores({ Privilegio, Tipo_Publicador, workbook })
        Publicadores = await sequelize.query(`select * from Publicadores`, {
            type: QueryTypes.SELECT
        })
    }
    let count = 0
    try {
        // Importar informes
        const jsonInf = xlsx.utils.sheet_to_json(sheet)
        for (let p of jsonInf) {
            let publicador = Publicadores.find(
                (pub) => (pub.apellidos ? pub.apellidos + ', ' : '') + pub.nombre == p.Nombre
            )
            if (!publicador) continue
            if (p.Nombre === 'Total') continue
            await sequelize.query(
                `insert or ignore into Informes(
					id_publicador, mes, mes_enviado, predico_en_el_mes, cursos_biblicos, id_tipo_publicador, horas, notas, horas_SS
				) values (?, ?, ?, ?, ?, ?, ?, ?, ?)
				 ON CONFLICT(id_publicador, mes) DO UPDATE SET
					mes_enviado = excluded.mes_enviado,
					predico_en_el_mes = excluded.predico_en_el_mes,
					cursos_biblicos = excluded.cursos_biblicos,
					id_tipo_publicador = excluded.id_tipo_publicador,
					horas = excluded.horas,
					notas = excluded.notas,
					horas_SS = excluded.horas_SS;`,
                {
                    type: QueryTypes.INSERT,
                    replacements: [
                        publicador.id,
                        p.Mes instanceof Date ? p.Mes.toISOString().substring(0, 10) : null,
                        p['Mes enviado'] instanceof Date
                            ? p['Mes enviado'].toISOString().substring(0, 10)
                            : null,
                        p['Predicó en el mes'] ? 1 : 0,
                        p['Cursos bíblicos'] || null,
                        p['Tipo Publicador'] === 'Publicador'
                            ? 1
                            : p['Tipo Publicador'] === 'Precursor regular'
                                ? 2
                                : 3,
                        p.Horas || null,
                        p.Notas || null,
                        p['Horas S. S. (PR)'] || null
                    ]
                }
            )
            count++
            if (showMessage)
                showMessage({
                    progress: Math.round((100 * count) / jsonInf.length),
                    message: `Informe importado: ${p.Nombre} - ${p.Mes?.toISOString().substring(0, 10)}...`
                })
        }
    } catch (e) {
        return { success: false, message: e.toString() }
    }
    return { success: true, message: `Informes importados: ${count}` }
}
const insertInformesGrupo = async ({
    workbook,
    Privilegio,
    Tipo_Publicador,
    Publicadores,
    filePath,
    showMessage
}) => {
    if (!workbook && !filePath)
        return { success: false, message: 'No se proporcionó workbook ni filePath' }

    if (!workbook) {
        try {
            workbook = xlsx.readFile(filePath, { cellDates: true })
        } catch (err) {
            return { success: false, message: 'Error al leer el archivo: ' + err.message }
        }
    }

    const sheet = workbook.Sheets['Informes']
    if (!sheet) return { success: false, message: 'No se encontró la hoja "Informes"' }

    if (!Tipo_Publicador) {
        await insertTipoPublicador()
        Tipo_Publicador = await sequelize.query(`select * from Tipos_Publicadores`, {
            type: QueryTypes.SELECT
        })
    }

    if (!Publicadores) {
        await insertPublicadores({ Privilegio, Tipo_Publicador, workbook })
        Publicadores = await sequelize.query(`select * from Publicadores`, {
            type: QueryTypes.SELECT
        })
    }
    let count = 0
    try {
        // Importar informes
        const jsonInf = xlsx.utils.sheet_to_json(sheet)
        for (let p of jsonInf) {
            let publicador = Publicadores.find(
                (pub) => (pub.apellidos ? pub.apellidos + ', ' : '') + pub.nombre == p.Nombre
            )
            if (!publicador) continue
            if (p.Nombre === 'Total') continue
            let params = [
                publicador.id,
                p.Mes instanceof Date ? p.Mes.toISOString().substring(0, 10) : null,
                p['Mes enviado'] instanceof Date
                    ? p['Mes enviado'].toISOString().substring(0, 10)
                    : null,
                p['Predicó en el mes'] ? 1 : 0,
                p['Cursos bíblicos'],
                p['Tipo Publicador'] === 'Publicador'
                    ? 1
                    : p['Tipo Publicador'] === 'Precursor regular'
                        ? 2
                        : 3,
                p.Horas,
                p.Notas,
                p['Horas S. S. (PR)']
            ]
            await sequelize.query(
                `insert or ignore into Informes(
					id_publicador, mes, mes_enviado, predico_en_el_mes, cursos_biblicos, id_tipo_publicador, horas, notas, horas_SS
				) values (?,?,?,?,?,?,?,?,?)
				 ON CONFLICT(id_publicador, mes) DO UPDATE SET
					mes_enviado = excluded.mes_enviado,
					predico_en_el_mes = excluded.predico_en_el_mes,
					cursos_biblicos = excluded.cursos_biblicos,
					id_tipo_publicador = excluded.id_tipo_publicador,
					horas = excluded.horas,
					notas = excluded.notas,
					horas_SS = excluded.horas_SS;`,
                {
                    type: QueryTypes.INSERT,
                    replacements: params
                }
            )
            count++
            if (showMessage)
                showMessage({
                    progress: Math.round((100 * count) / jsonInf.length),
                    message: `Informe importado: ${p.Nombre} - ${p.Mes?.toISOString().substring(0, 10)}...`
                })
        }
    } catch (e) {
        return { success: false, message: e.toString() }
    }
    return { success: true, message: `Informes importados: ${count}` }
}
const insertAsistencias = async ({ workbook, filePath, showMessage }) => {
    if (!workbook && !filePath)
        return { success: false, message: 'No se proporcionó workbook ni filePath' }

    if (!workbook) {
        try {
            workbook = xlsx.readFile(filePath, { cellDates: true })
        } catch (err) {
            return { success: false, message: 'Error al leer el archivo: ' + err.message }
        }
    }

    const sheet = workbook.Sheets['Asistencias']
    if (!sheet) return { success: false, message: 'No se encontró la hoja "Asistencias"' }

    let count = 0
    try {
        const jsonAsis = xlsx.utils.sheet_to_json(sheet)

        for (let p of jsonAsis) {
            count++
            if (p.Fecha === 'Total' || !p.Fecha) continue

            let fecha
            try {
                const fechaObj = new Date(p.Fecha)
                if (isNaN(fechaObj)) continue
                fecha = fechaObj.toISOString().substring(0, 10)
            } catch {
                continue
            }

            if (!fecha) continue
            await sequelize.query(
                `INSERT INTO Asistencias (fecha, asistentes, notas)
				 VALUES (?, ?, ?)
				 ON CONFLICT(fecha) DO UPDATE SET
				   asistentes = excluded.asistentes,
				   notas = excluded.notas;`,
                {
                    type: QueryTypes.INSERT,
                    replacements: [fecha, p.Asistentes || null, p.Notas || null]
                }
            )

            if (showMessage) {
                showMessage({
                    progress: Math.round((100 * count) / jsonAsis.length),
                    message: `Asistencia importada: ${fecha}...`
                })
            }
        }
    } catch (e) {
        return { success: false, message: e.toString() }
    }

    return { success: true, message: `Asistencias importadas: ${count}` }
}

const getDataFromXLSX = async ({ workbook, filePath, sheetName }) => {
    if (!workbook && !filePath)
        return { success: false, message: 'No se proporcionó workbook ni filePath' }

    if (!workbook) {
        try {
            workbook = xlsx.readFile(filePath, { cellDates: true })
        } catch (err) {
            return { success: false, message: 'Error al leer el archivo: ' + err.message }
        }
    }

    const sheet = workbook.Sheets[sheetName]
    if (!sheet) return { success: false, message: `No se encontró la hoja "${sheetName}"` }

    try {
        const data = xlsx.utils.sheet_to_json(sheet)
        return { success: true, data }
    } catch (e) {
        return { success: false, message: e.toString() }
    }
}

const importExcel = async (filePath = 'data/Publicadores_Informes.xlsx', showMessage = null) => {
    await insertPrivilegios()
    const Privilegio = await sequelize.query(`select * from Privilegios`, {
        type: QueryTypes.SELECT
    })

    await insertTipoPublicador()
    const Tipo_Publicador = await sequelize.query(`select * from Tipos_Publicadores`, {
        type: QueryTypes.SELECT
    })

    const workbook = xlsx.readFile(filePath, { cellDates: true })
    await insertPublicadores({ workbook, Privilegio, Tipo_Publicador, showMessage })
    const Publicadores = await sequelize.query(`select * from Publicadores`, {
        type: QueryTypes.SELECT
    })
    await insertInformes({ workbook, Privilegio, Tipo_Publicador, Publicadores, showMessage })
    await insertAsistencias({ workbook, showMessage })
    return { success: true }
}
//importExcel('C:\\Users\\DanielMedina\\OneDrive\\Congregación Jardines de Andalucía\\Secretario\\Jardines de Andalucía.xlsx').catch((err) => console.error(err));
export {
    insertTipoPublicador,
    insertAsistencias,
    insertInformes,
    insertInformesGrupo,
    insertPublicadores,
    getDataFromXLSX,
    importExcel
}
