import * as SQLite from 'expo-sqlite';
import { sequelize } from './models';

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

    // Using Sequelize to sync the schema
    try {
        // Authenticate doesn't always work in all bridge layers, but sync is what matters
        await sequelize.sync({ alter: true });
        console.log('Database schema initialized via Sequelize');
    } catch (error) {
        console.error('Sequelize sync failed, falling back to manual schema check:', error);

        // Fallback to manual schema creation if Sequelize fails in this environment
        const schema = `
            CREATE TABLE IF NOT EXISTS Publicadores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT, apellidos TEXT, fecha_nacimiento TEXT, fecha_bautismo TEXT,
                grupo INTEGER, sup_grupo INTEGER, sexo TEXT, id_privilegio INTEGER,
                id_tipo_publicador INTEGER, ungido INTEGER, calle TEXT, num TEXT,
                colonia TEXT, telefono_fijo INTEGER, telefono_movil INTEGER,
                contacto_emergencia TEXT, tel_contacto_emergencia INTEGER,
                correo_contacto_emergencia TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS Informes (
                id INTEGER PRIMARY KEY AUTOINCREMENT, id_publicador INTEGER, mes TEXT, 
                mes_enviado TEXT, predico_en_el_mes INTEGER, cursos_biblicos INTEGER, 
                id_tipo_publicador INTEGER, horas INTEGER, notas TEXT, horas_SS INTEGER, 
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS Asistencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT, asistentes INTEGER, 
                notas TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS Configuraciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT, clave TEXT UNIQUE, valor TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS PrecursoresAuxiliares (
                id INTEGER PRIMARY KEY AUTOINCREMENT, id_publicador INTEGER, mes TEXT, 
                notas TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS Privilegios (id INTEGER PRIMARY KEY AUTOINCREMENT, descripcion TEXT  ,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS Tipos_Publicadores (id INTEGER PRIMARY KEY AUTOINCREMENT, descripcion TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP);
        `;
        await db.execAsync(schema);
        console.log('Database schema initialized via manual fallback');
    }

    return db;
};
