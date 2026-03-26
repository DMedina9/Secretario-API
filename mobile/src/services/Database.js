import * as SQLite from 'expo-sqlite';

const databaseName = 'secretario.db';

let dbInstance = null;

export const getDb = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(databaseName);
    }
    return dbInstance;
};

export const initDatabase = async () => {
    const db = await getDb();

    // Consolidate all schema creation into one batch
    const schema = `
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

        CREATE TABLE IF NOT EXISTS asistencias (
            id INTEGER PRIMARY KEY NOT NULL,
            fecha TEXT,
            asistentes INTEGER,
            notas TEXT,
            tipo_asistencia TEXT
        );

        CREATE TABLE IF NOT EXISTS configuraciones (
            id INTEGER PRIMARY KEY NOT NULL,
            clave TEXT UNIQUE,
            valor TEXT
        );

        CREATE TABLE IF NOT EXISTS PrecursoresAuxiliares (
            id INTEGER PRIMARY KEY NOT NULL,
            id_publicador INTEGER,
            mes TEXT,
            notas TEXT
        );

        CREATE TABLE IF NOT EXISTS privilegios (
            id INTEGER PRIMARY KEY NOT NULL,
            descripcion TEXT
        );

        CREATE TABLE IF NOT EXISTS tipos_publicador (
            id INTEGER PRIMARY KEY NOT NULL,
            descripcion TEXT
        );
    `;

    try {
        await db.execAsync(schema);
        console.log('Database schema initialized');
    } catch (error) {
        console.error('Error initializing database schema:', error);
        throw error;
    }

    return db;
};
