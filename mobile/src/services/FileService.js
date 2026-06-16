import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_FOLDER_KEY = '@download_folder_uri';

/**
 * Prompts the user to re-authorize the download directory.
 * If authorized, saves the new directory Uri and returns it.
 * Otherwise returns null.
 */
const reauthorizeDirectory = async () => {
    return new Promise((resolve) => {
        Alert.alert(
            'Permiso Requerido',
            'La aplicación no tiene permisos para acceder a la carpeta de descargas configurada o esta ya no existe. ¿Deseas seleccionar una carpeta de descargas ahora?',
            [
                {
                    text: 'Cancelar',
                    onPress: () => resolve(null),
                    style: 'cancel'
                },
                {
                    text: 'Seleccionar Carpeta',
                    onPress: async () => {
                        try {
                            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                            if (permissions.granted) {
                                await AsyncStorage.setItem(DOWNLOAD_FOLDER_KEY, permissions.directoryUri);
                                Alert.alert('✅ Éxito', 'Carpeta de descargas configurada correctamente.');
                                resolve(permissions.directoryUri);
                            } else {
                                resolve(null);
                            }
                        } catch (e) {
                            console.error('Error requesting directory permissions:', e);
                            Alert.alert('Error', 'No se pudo seleccionar la carpeta.');
                            resolve(null);
                        }
                    }
                }
            ]
        );
    });
};


/**
 * Saves a file to the configured download folder (if on Android and configured)
 * or to the app's document directory, then opens the share dialog.
 * 
 * @param {string} sourceUri - The local URI of the file to save/share (e.g. from cache)
 * @param {string} filename - The desired filename
 */
export const saveAndShareFile = async (sourceUri, filename) => {
    try {
        let folderUri = await AsyncStorage.getItem(DOWNLOAD_FOLDER_KEY);
        let finalUri = sourceUri;

        if (Platform.OS === 'android' && folderUri) {
            // Use Storage Access Framework (SAF) to save to the specific folder
            try {
                const fileContent = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
                const mimeType = getMimeType(filename);
                
                const safUri = await FileSystem.StorageAccessFramework.createFileAsync(folderUri, filename, mimeType);
                await FileSystem.writeAsStringAsync(safUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
                // Do not set finalUri = safUri; Expo sharing requires a 'file://' scheme 
                // We leave finalUri = sourceUri so it shares the cached copy successfully.
                console.log('File saved to SAF directory:', safUri);
            } catch (safError) {
                console.error('Error saving with SAF, asking for reauthorization:', safError);
                const newFolderUri = await reauthorizeDirectory();
                if (newFolderUri) {
                    try {
                        const fileContent = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
                        const mimeType = getMimeType(filename);
                        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(newFolderUri, filename, mimeType);
                        await FileSystem.writeAsStringAsync(safUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
                        console.log('File saved to SAF directory after retry:', safUri);
                    } catch (retryError) {
                        console.error('Retry SAF write failed in saveAndShareFile:', retryError);
                    }
                }
            }
        } else {
            // Save to project document directory as a "persistent" copy
            const projectDir = FileSystem.documentDirectory + filename;
            await FileSystem.copyAsync({ from: sourceUri, to: projectDir });
            finalUri = projectDir;
        }

        // Share the file using the valid file:// scheme
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(finalUri);
        } else {
            Alert.alert('Éxito', 'El archivo se ha guardado en el dispositivo.');
        }
    } catch (error) {
        console.error('Error in saveAndShareFile:', error);
        Alert.alert('Error', 'No se pudo guardar o compartir el archivo.');
    }
};

/**
 * Saves a file to the configured download folder (if configured)
 * without triggering the sharing UI.
 * 
 * @param {string} sourceUri 
 * @param {string} filename 
 */
export const saveFileOnly = async (sourceUri, filename) => {
    try {
        let folderUri = await AsyncStorage.getItem(DOWNLOAD_FOLDER_KEY);
        
        if (Platform.OS === 'android' && folderUri) {
            try {
                const fileContent = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
                const mimeType = getMimeType(filename);
                
                const safUri = await FileSystem.StorageAccessFramework.createFileAsync(folderUri, filename, mimeType);
                await FileSystem.writeAsStringAsync(safUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
                Alert.alert('✅ Guardado', `El archivo se ha guardado en tu carpeta de descargas:\n${filename}`);
                // Intentar abrir el archivo con la aplicación por defecto (Android SAF uri)
                try {
                    if (Platform.OS === 'android') {
                        await IntentLauncher.startActivityAsync(IntentLauncher.ACTION_VIEW, { data: safUri, type: mimeType });
                    } else if (await Sharing.isAvailableAsync()) {
                        // En iOS/otros, abrir mediante el diálogo de compartir si está disponible
                        await Sharing.shareAsync(safUri);
                    } else {
                        await Linking.openURL(safUri);
                    }
                } catch (openErr) {
                    console.error('Error al abrir el archivo tras guardar (SAF):', openErr);
                }
                return true;
            } catch (safError) {
                console.error('SAF write failed, asking for reauthorization:', safError);
                const newFolderUri = await reauthorizeDirectory();
                if (newFolderUri) {
                    try {
                        const fileContent = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
                        const mimeType = getMimeType(filename);
                        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(newFolderUri, filename, mimeType);
                        await FileSystem.writeAsStringAsync(safUri, fileContent, { encoding: FileSystem.EncodingType.Base64 });
                        Alert.alert('✅ Guardado', `El archivo se ha guardado en tu carpeta de descargas:\n${filename}`);
                        try {
                            if (Platform.OS === 'android') {
                                await IntentLauncher.startActivityAsync(IntentLauncher.ACTION_VIEW, { data: safUri, type: mimeType });
                            } else if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(safUri);
                            } else {
                                await Linking.openURL(safUri);
                            }
                        } catch (openErr) {
                            console.error('Error al abrir el archivo tras guardar (SAF retry):', openErr);
                        }
                        return true;
                    } catch (retryError) {
                        console.error('Retry SAF write failed:', retryError);
                    }
                }
                
                // Fallback to internal app document directory if reauthorization failed or was cancelled
                const projectDir = FileSystem.documentDirectory + filename;
                await FileSystem.copyAsync({ from: sourceUri, to: projectDir });
                Alert.alert(
                    '⚠️ Guardado en Almacenamiento Interno',
                    `No se pudo guardar en la carpeta seleccionada debido a un problema de permisos. El archivo se guardó de forma interna en la aplicación:\n${filename}`
                );
                // Intentar abrir el archivo guardado en el directorio de la app
                try {
                    if (Platform.OS === 'android') {
                        const contentUri = await FileSystem.getContentUriAsync(projectDir);
                        await IntentLauncher.startActivityAsync(IntentLauncher.ACTION_VIEW, { data: contentUri, type: getMimeType(filename) });
                    } else if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(projectDir);
                    } else {
                        await Linking.openURL(projectDir);
                    }
                } catch (openErr) {
                    console.error('Error al abrir el archivo tras guardar (interno):', openErr);
                }
                return true;
            }
        } else {
            // Save to project document directory as fallback
            const projectDir = FileSystem.documentDirectory + filename;
            await FileSystem.copyAsync({ from: sourceUri, to: projectDir });
            Alert.alert('✅ Guardado', `El archivo se ha guardado en el almacenamiento de la app:\n${filename}`);
            try {
                if (Platform.OS === 'android') {
                    const contentUri = await FileSystem.getContentUriAsync(projectDir);
                    await IntentLauncher.startActivityAsync(IntentLauncher.ACTION_VIEW, { data: contentUri, type: getMimeType(filename) });
                } else if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(projectDir);
                } else {
                    await Linking.openURL(projectDir);
                }
            } catch (openErr) {
                console.error('Error al abrir el archivo tras guardar (fallback):', openErr);
            }
            return true;
        }
    } catch (error) {
        console.error('Error in saveFileOnly:', error);
        Alert.alert('Error', 'No se pudo guardar el archivo en el disco.');
        return false;
    }
};

/**
 * Checks if the download folder is configured, and offers the user to either:
 * 1. Only save to disk.
 * 2. Save and share.
 * 3. Cancel.
 * If the download folder is not configured, it directly saves and shares.
 * 
 * @param {string} sourceUri 
 * @param {string} filename 
 */
export const saveOrShareFile = async (sourceUri, filename) => {
    try {
        const folderUri = await AsyncStorage.getItem(DOWNLOAD_FOLDER_KEY);
        const isConfigured = Platform.OS === 'android' && folderUri;
        
        if (isConfigured) {
            Alert.alert(
                'Guardar Reporte',
                `¿Qué deseas hacer con el archivo "${filename}"?`,
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel'
                    },
                    {
                        text: 'Sólo guardar en disco',
                        onPress: () => saveFileOnly(sourceUri, filename)
                    },
                    {
                        text: 'Guardar y compartir',
                        onPress: () => saveAndShareFile(sourceUri, filename)
                    }
                ]
            );
        } else {
            await saveAndShareFile(sourceUri, filename);
        }
    } catch (error) {
        console.error('Error in saveOrShareFile:', error);
        await saveAndShareFile(sourceUri, filename);
    }
};

/** Simple MIME type helper */
const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf': return 'application/pdf';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'zip': return 'application/zip';
        case 'json': return 'application/json';
        case 'db': return 'application/octet-stream';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        default: return 'application/octet-stream';
    }
};

export default {
    saveAndShareFile,
    saveFileOnly,
    saveOrShareFile
};
