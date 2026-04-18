import { Sequelize, DataTypes, QueryTypes } from 'rn-sequelize';
import * as SQLite from './expo-sqlite-shim';

// We'll export the instance and models. 
// Initialization will happen in Database.js
const sequelize = new Sequelize({
    database: 'secretario',
    dialect: 'sqlite',
    storage: 'secretario.db',
    logging: false,
    dialectModule: SQLite, // This is the key for Expo compatibility
    dialectOptions: {
        version: '1.0',
        description: 'Secretario DB',
        size: 4 * 1024 * 1024,
    },
});

// Model Definitions
// Publicadores
export const Publicadores = sequelize.define('Publicadores', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: DataTypes.TEXT,
    apellidos: DataTypes.TEXT,
    fecha_nacimiento: DataTypes.TEXT,
    fecha_bautismo: DataTypes.TEXT,
    grupo: DataTypes.INTEGER,
    sup_grupo: DataTypes.INTEGER,
    sexo: DataTypes.TEXT,
    id_privilegio: DataTypes.INTEGER,
    id_tipo_publicador: DataTypes.INTEGER,
    ungido: DataTypes.INTEGER,
    sordo: DataTypes.INTEGER,
    ciego: DataTypes.INTEGER,
    encarcelado: DataTypes.INTEGER,
    calle: DataTypes.TEXT,
    num: DataTypes.TEXT,
    colonia: DataTypes.TEXT,
    telefono_fijo: DataTypes.INTEGER,
    telefono_movil: DataTypes.INTEGER,
    contacto_emergencia: DataTypes.TEXT,
    tel_contacto_emergencia: DataTypes.INTEGER,
    correo_contacto_emergencia: DataTypes.TEXT
}, {
    indexes: [{ unique: true, fields: ['nombre', 'apellidos'] }]
})

// Informes
export const Informes = sequelize.define('Informes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_publicador: DataTypes.INTEGER,
    mes: DataTypes.TEXT,
    mes_enviado: DataTypes.TEXT,
    predico_en_el_mes: DataTypes.INTEGER,
    cursos_biblicos: DataTypes.INTEGER,
    id_tipo_publicador: DataTypes.INTEGER,
    horas: DataTypes.INTEGER,
    notas: DataTypes.TEXT,
    horas_SS: DataTypes.INTEGER
}, {
    indexes: [{ unique: true, fields: ['id_publicador', 'mes'] }]
})

// PrecursoresAuxiliares
export const PrecursoresAuxiliares = sequelize.define('PrecursoresAuxiliares', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    id_publicador: DataTypes.INTEGER,
    mes: DataTypes.TEXT,
    notas: DataTypes.TEXT
}, {
    indexes: [{ unique: true, fields: ['id_publicador', 'mes'] }]
})

// Asistencias
export const Asistencias = sequelize.define('Asistencias', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha: { type: DataTypes.TEXT, unique: true },
    asistentes: DataTypes.INTEGER,
    notas: DataTypes.TEXT
}, {
    indexes: [{ unique: true, fields: ['fecha'] }]
})

// Configuración
export const Configuracion = sequelize.define('Configuraciones', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    clave: { type: DataTypes.TEXT, unique: true },
    valor: DataTypes.TEXT,
    tipo: DataTypes.TEXT
}, {
    indexes: [{ unique: true, fields: ['clave'] }]
})

// Privilegio
export const Privilegio = sequelize.define('Privilegios', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    descripcion: { type: DataTypes.TEXT, unique: true }
}, {
    indexes: [{ unique: true, fields: ['descripcion'] }]
})

// Tipo de Publicador
export const TipoPublicador = sequelize.define('Tipos_Publicadores', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    descripcion: { type: DataTypes.TEXT, unique: true }
}, {
    indexes: [{ unique: true, fields: ['descripcion'] }]
})

// ======================
// RELACIONES (si deseas)
// ======================

Publicadores.belongsTo(Privilegio, { foreignKey: 'id_privilegio' })
Publicadores.belongsTo(TipoPublicador, { foreignKey: 'id_tipo_publicador' })

Informes.belongsTo(Publicadores, { foreignKey: 'id_publicador' })
Informes.belongsTo(TipoPublicador, { foreignKey: 'id_tipo_publicador' })

PrecursoresAuxiliares.belongsTo(Publicadores, { foreignKey: 'id_publicador' })

export { sequelize, QueryTypes };
