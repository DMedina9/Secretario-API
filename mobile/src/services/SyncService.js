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

    try {
        const resp = await api.get('/sync/all');
        if (!resp.data.success) return false;

        const { publicadores, informes, asistencias, configuraciones, precursoresAuxiliares } = resp.data.data;
        const db = await getDb();

        await db.withTransactionAsync(async () => {
            // Clear and reload Publicadores
            await db.runAsync('DELETE FROM publicadores');
            for (const p of publicadores) {
                await db.runAsync(`
                    INSERT INTO publicadores (
                        id, nombre, apellidos, fecha_nacimiento, fecha_bautismo, grupo, sup_grupo, sexo,
                        id_privilegio, id_tipo_publicador, ungido, calle, num, colonia, telefono_fijo,
                        telefono_movil, contacto_emergencia, tel_contacto_emergencia, correo_contacto_emergencia,
                        privilegio, tipo_publicador, Estatus
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    p.id, p.nombre, p.apellidos, p.fecha_nacimiento, p.fecha_bautismo, p.grupo, p.sup_grupo, p.sexo,
                    p.id_privilegio, p.id_tipo_publicador, p.ungido, p.calle, p.num, p.colonia, p.telefono_fijo,
                    p.telefono_movil, p.contacto_emergencia, p.tel_contacto_emergencia, p.correo_contacto_emergencia,
                    p.privilegio, p.tipo_publicador, p.Estatus
                ]);
            }

            // Clear and reload Informes
            await db.runAsync('DELETE FROM informes');
            for (const i of informes) {
                await db.runAsync(`
                    INSERT INTO informes (
                        id, id_publicador, mes, horas, minutos, publicaciones, videos, revisitas,
                        cursos_biblicos, predico_en_el_mes, horas_SS, notas
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    i.id, i.id_publicador, i.mes, i.horas, i.minutos, i.publicaciones, i.videos, i.revisitas,
                    i.cursos_biblicos, i.predico_en_el_mes, i.horas_SS, i.notas
                ]);
            }

            // Clear and reload Asistencias
            await db.runAsync('DELETE FROM asistencias');
            for (const a of asistencias) {
                await db.runAsync(`
                    INSERT INTO asistencias (id, fecha, asistentes, notas, tipo_asistencia) VALUES (?,?,?,?,?)
                `, [a.id, a.fecha, a.asistentes, a.notas, a.tipo_asistencia]);
            }

            // Clear and reload Configuraciones
            await db.runAsync('DELETE FROM configuraciones');
            for (const c of configuraciones) {
                await db.runAsync(`
                    INSERT INTO configuraciones (id, clave, valor) VALUES (?,?,?)
                `, [c.id, c.clave, c.valor]);
            }

            // Clear and reload Precursores Auxiliares
            await db.runAsync('DELETE FROM precursores_auxiliares');
            for (const pa of precursoresAuxiliares) {
                await db.runAsync(`
                    INSERT INTO precursores_auxiliares (id, id_publicador, anio_servicio, mes) VALUES (?,?,?,?)
                `, [pa.id, pa.id_publicador, pa.anio_servicio, pa.mes]);
            }
        });

        await AsyncStorage.setItem('@last_sync', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Error syncing data:', error);
        return false;
    }
};
