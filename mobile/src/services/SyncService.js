import api from './api';
import { Publicadores, Informes, Asistencias, Configuracion, PrecursoresAuxiliares, Privilegio, TipoPublicador } from './models';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const pushEntityChanges = async (model, endpoint) => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return { success: false, error: 'Sin conexión' };

    const dirtyRecords = await model.findAll({ where: { is_dirty: true } });
    if (dirtyRecords.length === 0) return { success: true, count: 0 };

    console.log(`Pushing ${dirtyRecords.length} changes for ${model.name}...`);
    try {
        let successCount = 0;
        for (const record of dirtyRecords) {
            try {
                const plain = record.get({ plain: true });
                const { is_dirty, last_sync, ...data } = plain;

                let response;
                // If the record was already on the server (has an ID that we trust is the server's)
                // Or if we should try PUT first. 
                // In this specific app, let's assume if it's dirty and has an ID, we try to update it if it's not "new".
                // Since we don't have a 'is_new' flag, we'll use a simple heuristic: 
                // if we just created it locally and it's dirty, we'll try POST /add. 
                // But how do we know if it was ALREADY on the server?
                // Usually by checking if 'last_sync' is null.

                if (last_sync) {
                    // Was previously synced, so update
                    response = await api.put(`${endpoint}/${data.id}`, data);
                } else {
                    // Never synced, so Create
                    // Strip ID to let server generate it, OR keep it if the server respects it.
                    // Looking at backend addPublicador, it uses Publicadores.create(req.body).
                    const { id, ...newData } = data;
                    response = await api.post(`${endpoint}/add`, newData);
                }

                if (response.data.success) {
                    await record.update({
                        is_dirty: false,
                        last_sync: new Date(),
                        id: response.data.lastID || record.id // Update local ID if server returned a new one
                    });
                    successCount++;
                }
            } catch (error) {
                console.error(`Failed to push record ${record.id}:`, error);
            }
        }

        return { success: true, count: successCount };
    } catch (error) {
        console.error(`Error pushing ${model.name}:`, error);
        return { success: false, error: error.message };
    }
};

export const syncAllData = async () => {
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
        console.log('No internet connection, skipping sync');
        return false;
    }

    console.log('Starting PULL sync process...');
    try {
        const resp = await api.get('/sync/all');
        if (!resp.data.success) {
            console.error('Sync API failed:', resp.data.error);
            return false;
        }

        const raw = resp.data.data || {};
        const cleanData = (list) => (Array.isArray(list) ? list.filter(item => item && typeof item === 'object') : []);

        const entities = [
            { remote: cleanData(raw.publicadores), model: Publicadores },
            { remote: cleanData(raw.informes), model: Informes },
            { remote: cleanData(raw.asistencias), model: Asistencias },
            { remote: cleanData(raw.configuraciones), model: Configuracion },
            { remote: cleanData(raw.precursoresAuxiliares), model: PrecursoresAuxiliares },
            { remote: cleanData(raw.privilegios), model: Privilegio },
            { remote: cleanData(raw.tiposPublicador), model: TipoPublicador }
        ];

        for (const { remote, model } of entities) {
            for (const item of remote) {
                if (!item.id) continue;

                // Check if local exists and is dirty
                const local = await model.findByPk(item.id);
                if (local && local.is_dirty) {
                    // Skip overwriting local changes not yet pushed
                    console.log(`Skipping local dirty record ${model.name}:${item.id}`);
                    continue;
                }

                // Upsert (Sequelize upsert or find/create/update)
                // We'll use a transaction for safety
                await model.upsert({ ...item, is_dirty: false, last_sync: new Date() });
            }
        }

        await AsyncStorage.setItem('@last_sync', new Date().toISOString());
        console.log('PULL sync completed');
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
            return await syncAllData();
        }
        const lastDate = new Date(lastSync);
        const now = new Date();
        const needsSync = lastDate.getMonth() !== now.getMonth() || lastDate.getFullYear() !== now.getFullYear();
        if (needsSync) {
            return await syncAllData();
        }
        return true;
    } catch (error) {
        console.error('Error in syncIfNeeded:', error);
        return false;
    }
};
