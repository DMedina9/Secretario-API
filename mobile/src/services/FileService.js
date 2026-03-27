import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOAD_FOLDER_KEY = '@download_folder_uri';

/**
 * Saves a file to the configured download folder (if on Android and configured)
 * or to the app's document directory, then opens the share dialog.
 * 
 * @param {string} sourceUri - The local URI of the file to save/share (e.g. from cache)
 * @param {string} filename - The desired filename
 */
export const saveAndShareFile = async (sourceUri, filename) => {
    try {
        const folderUri = await AsyncStorage.getItem(DOWNLOAD_FOLDER_KEY);
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
                console.error('Error saving with SAF, falling back to cache:', safError);
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
    saveAndShareFile
};
