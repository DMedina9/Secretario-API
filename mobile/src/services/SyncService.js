import api from './api';
import { getDb } from './Database';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const syncAllData = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
        console.log('No internet connection, skipping sync');
        return false;
    }

    console.log('Starting sync process...');
    try {
        const resp = await api.get('/sync/all');
        if (!resp.data.success) {
            console.error('Sync API failed:', resp.data.error);
            return false;
        }

        const raw = resp.data.data || {};
        const clean = (list) => (Array.isArray(list) ? list.filter(item => item && typeof item === 'object') : []);

        const publicadores = clean(raw.publicadores);
        const informes = clean(raw.informes);
        const asistencias = clean(raw.asistencias);
        const configuraciones = clean(raw.configuraciones);
        const precursoresAuxiliares = clean(raw.precursoresAuxiliares);
        const privilegios = clean(raw.privilegios);
        const tiposPublicador = clean(raw.tiposPublicador);
        
        console.log(`Data to sync: ${publicadores.length} pubs, ${informes.length} infs, ${asistencias.length} asists`);
        
        const db = await getDb();
        const sanitize = (val) => (val === undefined ? null : val);

        try {
            await db.execAsync('BEGIN TRANSACTION');

            // Publicadores
            await db.runAsync('DELETE FROM publicadores');
            for (const p of publicadores) {
                if (p.id === undefined || p.id === null) continue;
                await db.runAsync(`
                    INSERT INTO publicadores (
                        id, nombre, apellidos, fecha_nacimiento, fecha_bautismo, grupo, sup_grupo, sexo,
                        id_privilegio, id_tipo_publicador, ungido, calle, num, colonia, telefono_fijo,
                        telefono_movil, contacto_emergencia, tel_contacto_emergencia, correo_contacto_emergencia,
                        privilegio, tipo_publicador, Estatus
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    sanitize(p.id), sanitize(p.nombre), sanitize(p.apellidos), sanitize(p.fecha_nacimiento), 
                    sanitize(p.fecha_bautismo), sanitize(p.grupo), sanitize(p.sup_grupo), sanitize(p.sexo),
                    sanitize(p.id_privilegio), sanitize(p.id_tipo_publicador), sanitize(p.ungido), sanitize(p.calle), 
                    sanitize(p.num), sanitize(p.colonia), sanitize(p.telefono_fijo), sanitize(p.telefono_movil), 
                    sanitize(p.contacto_emergencia), sanitize(p.tel_contacto_emergencia), sanitize(p.correo_contacto_emergencia),
                    sanitize(p.privilegio), sanitize(p.tipo_publicador), sanitize(p.Estatus)
                ]);
            }

            // Informes
            await db.runAsync('DELETE FROM informes');
            for (const i of informes) {
                if (i.id === undefined || i.id === null) continue;
                await db.runAsync(`
                    INSERT INTO informes (
                        id, id_publicador, mes, horas, minutos, publicaciones, videos, revisitas,
                        cursos_biblicos, predico_en_el_mes, horas_SS, notas
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    sanitize(i.id), sanitize(i.id_publicador), sanitize(i.mes), sanitize(i.horas), 
                    sanitize(i.minutos), sanitize(i.publicaciones), sanitize(i.videos), sanitize(i.revisitas),
                    sanitize(i.cursos_biblicos), sanitize(i.predico_en_el_mes), sanitize(i.horas_SS), sanitize(i.notas)
                ]);
            }

            // Asistencias
            await db.runAsync('DELETE FROM asistencias');
            for (const a of asistencias) {
                if (a.id === undefined || a.id === null) continue;
                await db.runAsync(`
                    INSERT INTO asistencias (id, fecha, asistentes, notas, tipo_asistencia) VALUES (?,?,?,?,?)
                `, [
                    sanitize(a.id), sanitize(a.fecha), sanitize(a.asistentes), sanitize(a.notas), sanitize(a.tipo_asistencia)
                ]);
            }

            // Configuraciones
            await db.runAsync('DELETE FROM configuraciones');
            for (const c of configuraciones) {
                if (c.id === undefined || c.id === null) continue;
                await db.runAsync(`
                    INSERT INTO configuraciones (id, clave, valor) VALUES (?,?,?)
                `, [sanitize(c.id), sanitize(c.clave), sanitize(c.valor)]);
            }

            // Precursores Auxiliares
            await db.runAsync('DELETE FROM precursores_auxiliares');
            for (const pa of precursoresAuxiliares) {
                if (pa.id === undefined || pa.id === null) continue;
                await db.runAsync(`
                    INSERT INTO precursores_auxiliares (id, id_publicador, anio_servicio, mes, notas) VALUES (?,?,?,?,?)
                `, [
                    sanitize(pa.id), sanitize(pa.id_publicador), sanitize(pa.anio_servicio), 
                    sanitize(pa.mes), sanitize(pa.notas)
                ]);
            }

            // Privilegios
            await db.runAsync('DELETE FROM privilegios');
            for (const pr of privilegios) {
                if (pr.id === undefined || pr.id === null) continue;
                await db.runAsync(`
                    INSERT INTO privilegios (id, descripcion) VALUES (?,?)
                `, [sanitize(pr.id), sanitize(pr.descripcion)]);
            }

            // Tipos Publicador
            await db.runAsync('DELETE FROM tipos_publicador');
            for (const tp of tiposPublicador) {
                if (tp.id === undefined || tp.id === null) continue;
                await db.runAsync(`
                    INSERT INTO tipos_publicador (id, descripcion) VALUES (?,?)
                `, [sanitize(tp.id), sanitize(tp.descripcion)]);
            }

            await db.execAsync('COMMIT');
            console.log('Sync completed and committed');
        } catch (txnError) {
            console.error('Transaction failed:', txnError);
            try { await db.execAsync('ROLLBACK'); } catch (e) { /* ignore rollback error */ }
            throw txnError;
        }

        await AsyncStorage.setItem('@last_sync', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Sync failed finally:', error);
        return false;
    }
};
export const syncIfNeeded = async () => {
    try {
        const lastSync = await AsyncStorage.getItem('@last_sync');
        if (!lastSync) {
            console.log('No previous sync found, triggering sync...');
            return await syncAllData();
        }

        const lastDate = new Date(lastSync);
        const now = new Date();

        // Sync if it's a different month or year
        const needsSync = lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear();

        if (needsSync) {
            console.log('New month detected, triggering automatic sync...');
            return await syncAllData();
        }

        console.log('Sync not needed yet (already synced this month)');
        return true;
    } catch (error) {
        console.error('Error in syncIfNeeded:', error);
        return false;
    }
};
