import * as SQLite from 'expo-sqlite';

const databaseName = 'secretario.db';

export const initDatabase = async () => {
    const db = await SQLite.openDatabaseAsync(databaseName);
    
    // Publicadores
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS publicadores (
            id INTEGER PRIMARY KEY NOT NULL,
            nombre TEXT,
            apellidos TEXT,
            fecha_nacimiento TEXT,
            fecha_bautismo TEXT,
            grupo INTEGER,
            sup_grupo INTEGER,
            sexo TEXT,
            id_privilegio INTEGER,
            id_tipo_publicador INTEGER,
            ungido INTEGER,
            calle TEXT,
            num TEXT,
            colonia TEXT,
            telefono_fijo TEXT,
            telefono_movil TEXT,
            contacto_emergencia TEXT,
            tel_contacto_emergencia TEXT,
            correo_contacto_emergencia TEXT,
            privilegio TEXT,
            tipo_publicador TEXT,
            Estatus TEXT
        );
    `);

    // Informes
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS informes (
            id INTEGER PRIMARY KEY NOT NULL,
            id_publicador INTEGER,
            mes TEXT,
            horas INTEGER,
            minutos INTEGER,
            publicaciones INTEGER,
            videos INTEGER,
            revisitas INTEGER,
            cursos_biblicos INTEGER,
            predico_en_el_mes INTEGER,
            horas_SS INTEGER,
            notas TEXT
        );
    `);

    // Asistencias
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS asistencias (
            id INTEGER PRIMARY KEY NOT NULL,
            fecha TEXT,
            asistentes INTEGER,
            notas TEXT,
            tipo_asistencia TEXT
        );
    `);

    // Configuraciones
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS configuraciones (
            id INTEGER PRIMARY KEY NOT NULL,
            clave TEXT UNIQUE,
            valor TEXT
        );
    `);

    // Precursores Auxiliares
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS precursores_auxiliares (
            id INTEGER PRIMARY KEY NOT NULL,
            id_publicador INTEGER,
            anio_servicio INTEGER,
            mes TEXT
        );
    `);

    return db;
};

export const getDb = async () => {
    return await SQLite.openDatabaseAsync(databaseName);
};
