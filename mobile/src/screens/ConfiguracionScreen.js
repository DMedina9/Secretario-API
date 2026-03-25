import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal, TextInput, Switch
} from 'react-native';
import { ArrowLeft, Settings, Database, Wrench, Users, ChevronRight, Moon, Sun, RefreshCcw } from 'lucide-react-native';
import { getAllConfiguraciones } from '../services/repositories/ConfiguracionesRepo';
import { syncAllData } from '../services/SyncService';
import { useTheme } from '../contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io as ioClient } from 'socket.io-client';
import FileService from '../services/FileService';

// ─── Sub-section: Configuraciones ─────────────────────────────────────────────
const ConfiguracionesSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const items = [
        { key: 'nombre_congregacion', label: 'Nombre de la Congregación', desc: 'Identidad de la congregación' },
        { key: 'correo_admin', label: 'Correo del Administrador', desc: 'Correo electrónico del administrador' },
        { key: 'total_territorios', label: 'Total de Territorios', desc: 'Cantidad total de territorios' },
        { key: 'territorios_no_predicados', label: 'Territorios No Predicados', desc: 'Cantidad de territorios no predicados' },
        { key: 'mes_informe', label: 'Mes de Informe', desc: 'Referencia global de informes' },
    ];

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [inputValue, setInputValue] = useState('');

    const [configuraciones, setConfiguraciones] = useState([]);

    const fetchConfiguraciones = async () => {
        try {
            const data = await getAllConfiguraciones();
            setConfiguraciones(data);
        } catch (error) {
            console.error('Error al obtener configuraciones locales:', error);
        }
    };

    useEffect(() => {
        fetchConfiguraciones();
    }, []);

    const handleEditConfig = async (type) => {
        setSelectedConfig(type);
        const configuracion = configuraciones.find(c => c.clave === type);
        setInputValue(configuracion?.valor || '');
        setIsModalVisible(true);
    };

    const handleSaveConfig = async () => {
        if (!inputValue.trim()) {
            Alert.alert('Error', 'El valor no puede estar vacío.');
            return;
        }

        try {
            await api.put(`/configuraciones/${selectedConfig}`, { value: inputValue });
            await syncAllData(); // Refresh local DB
            Alert.alert('Éxito', 'Configuración actualizada correctamente.');
            setIsModalVisible(false);
            fetchConfiguraciones();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la configuración.');
        }
    };

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>⚙️ Configuraciones del Sistema</Text>
            {items.map((item, i) => (
                <TouchableOpacity key={i} style={st.configRow} onPress={() => handleEditConfig(item.key)}>
                    <View>
                        <Text style={st.configLabel}>{item.label}</Text>
                        <Text style={st.configDesc}>{item.desc}</Text>
                    </View>
                    <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={st.modalOverlay}>
                    <View style={st.modalContent}>
                        <Text style={st.modalTitle}>Editar {selectedConfig}</Text>
                        <TextInput
                            style={st.modalInput}
                            placeholder={`Ingrese el nuevo valor para ${selectedConfig}`}
                            value={inputValue}
                            onChangeText={setInputValue}
                            keyboardType="default"
                        />
                        <View style={st.modalButtons}>
                            <TouchableOpacity
                                style={[st.modalButton, st.modalButtonCancel]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={st.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[st.modalButton, st.modalButtonSave]}
                                onPress={handleSaveConfig}
                            >
                                <Text style={st.modalButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Sub-section: Gestión de Datos ───────────────────────────────────────────
const GestionDatosSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(null);

    const handleExport = async (tableKey, tableName) => {
        Alert.alert(
            `Exportar ${tableName}`,
            'Selecciona el formato de exportación',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'XLSX', onPress: () => downloadAndShare(tableKey, 'excel', 'xlsx') },
                { text: 'JSON', onPress: () => downloadAndShare(tableKey, 'json', 'json') },
                { text: 'XML', onPress: () => downloadAndShare(tableKey, 'xml', 'xml') }
            ]
        );
    };

    const handleImport = async (tableKey, tableName) => {
        Alert.alert(
            `Importar ${tableName}`,
            'Selecciona el formato de importación',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'XLSX', onPress: () => importFromFile(tableKey, 'excel') },
                { text: 'JSON', onPress: () => importFromFile(tableKey, 'json') },
                { text: 'XML', onPress: () => importFromFile(tableKey, 'xml') }
            ]
        );
    };

    const downloadAndShare = async (tableKey, format, extension) => {
        setLoading(tableKey);
        try {
            const token = await AsyncStorage.getItem('@auth_token');
            const url = `${api.defaults.baseURL}/${tableKey}/export?format=${format}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-mobile-app': 'true',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            let binary = '';
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64data = btoa(binary);

            const filename = `${tableKey}_export.${extension}`;
            const fileUri = FileSystem.cacheDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, base64data, { encoding: FileSystem.EncodingType.Base64 });

            await FileService.saveAndShareFile(fileUri, filename);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(null);
        }
    };

    const importFromFile = async (tableKey, format) => {
        try {
            let mimeType = '*/*';
            if (format === 'json') mimeType = 'application/json';
            else if (format === 'excel') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (format === 'xml') mimeType = 'application/xml';

            const result = await DocumentPicker.getDocumentAsync({ type: mimeType });
            if (result.canceled) return;

            setLoading(`import_${tableKey}`);

            const token = await AsyncStorage.getItem('@auth_token');
            let response;
            if (format === 'json') {
                // For JSON, read and parse
                const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
                const data = JSON.parse(fileContent);
                response = await fetch(`${api.defaults.baseURL}/${tableKey}/import`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'x-mobile-app': 'true'
                    },
                    body: JSON.stringify({ format, data })
                });
                if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
            } else {
                // For Excel and XML, send as file
                const formData = new FormData();
                formData.append('file', {
                    uri: result.assets[0].uri,
                    name: result.assets[0].name,
                    type: result.assets[0].mimeType || 'application/octet-stream'
                });

                response = await fetch(`${api.defaults.baseURL}/${tableKey}/import`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-mobile-app': 'true'
                    },
                    body: formData
                });
                if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
            }

            const resultData = await response.json();
            Alert.alert('Éxito', 'Datos importados correctamente.');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(null);
        }
    };

    const downloadBackup = async () => {
        setLoading('backup');
        try {
            // Obtener el token desde AsyncStorage
            const token = await AsyncStorage.getItem('@auth_token');
            if (!token) throw new Error('No hay token de autenticación');
            const url = `${api.defaults.baseURL}/backup/download`;
            const options = {
                method: 'GET',
                headers: {
                    'x-mobile-app': 'true',
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await fetch(url, options);
            if (!response.ok) throw new Error('Error al descargar respaldo');

            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1];
                    const filename = `backup-${Date.now()}.db`;
                    const fileUri = FileSystem.cacheDirectory + filename;
                    await FileSystem.writeAsStringAsync(fileUri, base64data, { encoding: FileSystem.EncodingType.Base64 });
                    
                    await FileService.saveAndShareFile(fileUri, filename);
                } catch (e) {
                    Alert.alert('Error', 'No se pudo guardar el respaldo.');
                } finally {
                    setLoading(null);
                }
            };
        } catch (error) {
            Alert.alert('Error', error.message);
            setLoading(null);
        }
    };

    const restoreBackup = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            if (result.canceled) return;
            // Pedir confirmación antes de proceder
            Alert.alert(
                'Confirmar restauración',
                'La restauración reemplazará completamente la base de datos del servidor. ¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Restaurar', style: 'destructive', onPress: async () => {
                            setLoading('restore');
                            try {
                                const form = new FormData();
                                form.append('backup', {
                                    uri: result.assets[0].uri,
                                    name: result.assets[0].name || 'backup.db',
                                    type: result.assets[0].mimeType || 'application/octet-stream'
                                });

                                const resp = await fetch(`${api.defaults.baseURL}/backup/restore`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    body: form
                                });

                                const data = await resp.json();
                                if (data && data.success) {
                                    Alert.alert('Éxito', 'Restauración completada.');
                                } else {
                                    Alert.alert('Error', 'No se pudo restaurar: ' + (data.error || 'respuesta inesperada'));
                                }
                            } catch (e) {
                                Alert.alert('Error', 'No se pudo restaurar el respaldo.');
                            } finally {
                                setLoading(null);
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            Alert.alert('Error', 'No se pudo restaurar el respaldo.');
        } finally {
            // loading is handled in the confirmation branch
        }
    };

    const actions = [
        { key: 'publicador', label: 'Exportar Publicadores', icon: '📋' },
        { key: 'asistencias', label: 'Exportar Asistencias', icon: '📊' },
        { key: 'informe', label: 'Exportar Informes', icon: '📈' },
    ];

    const importActions = [
        { key: 'publicador', label: 'Importar Publicadores', icon: '📥' },
        { key: 'asistencias', label: 'Importar Asistencias', icon: '📥' },
        { key: 'informe', label: 'Importar Informes', icon: '📥' },
    ];

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>📊 Gestión de Datos</Text>
            <Text style={st.cardSubtitle}>Exporta e importa datos desde la aplicación móvil.</Text>
            <Modal
                visible={loading === 'restore' || loading === 'backup'}
                transparent
                animationType="fade"
            >
                <View style={st.modalOverlayCentered}>
                    <View style={st.modalProgress}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={{ marginTop: 12, color: colors.text }}>{loading === 'backup' ? 'Descargando respaldo...' : 'Restaurando respaldo...'}</Text>
                    </View>
                </View>
            </Modal>
            {actions.map(a => (
                <TouchableOpacity
                    key={a.key}
                    style={[st.actionRow, loading === a.key && { opacity: 0.5 }]}
                    onPress={() => handleExport(a.key, a.label)}
                    disabled={loading !== null}
                >
                    <Text style={st.actionIcon}>{a.icon}</Text>
                    {loading === a.key ? (
                        <ActivityIndicator style={{ flex: 1, alignItems: 'flex-start' }} color={colors.primary} />
                    ) : (
                        <Text style={st.actionLabel}>{a.label}</Text>
                    )}
                    <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}

            {importActions.map(a => (
                <TouchableOpacity
                    key={`import_${a.key}`}
                    style={[st.actionRow, loading === `import_${a.key}` && { opacity: 0.5 }]}
                    onPress={() => handleImport(a.key, a.label)}
                    disabled={loading !== null}
                >
                    <Text style={st.actionIcon}>{a.icon}</Text>
                    {loading === `import_${a.key}` ? (
                        <ActivityIndicator style={{ flex: 1, alignItems: 'flex-start' }} color={colors.primary} />
                    ) : (
                        <Text style={st.actionLabel}>{a.label}</Text>
                    )}
                    <ChevronRight size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}

            <TouchableOpacity
                style={[st.actionRow, loading === 'backup' && { opacity: 0.5 }]}
                onPress={downloadBackup}
                disabled={!!loading}
            >
                <Text style={st.actionIcon}>💾</Text>
                {loading === 'backup' ? (
                    <ActivityIndicator style={{ flex: 1, alignItems: 'flex-start' }} color={colors.primary} />
                ) : (
                    <Text style={st.actionLabel}>Descargar Respaldo de la Base</Text>
                )}
                <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[st.actionRow, loading === 'restore' && { opacity: 0.5 }]}
                onPress={restoreBackup}
                disabled={!!loading}
            >
                <Text style={st.actionIcon}>🔁</Text>
                {loading === 'restore' ? (
                    <ActivityIndicator style={{ flex: 1, alignItems: 'flex-start' }} color={colors.primary} />
                ) : (
                    <Text style={st.actionLabel}>Restaurar Respaldo desde Archivo</Text>
                )}
                <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
};

// ─── Sub-section: Archivos ────────────────────────────────────────────────────
const ArchivosSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [folderUri, setFolderUri] = useState(null);

    useEffect(() => {
        const loadFolderUri = async () => {
            const uri = await AsyncStorage.getItem('@download_folder_uri');
            setFolderUri(uri);
        };
        loadFolderUri();
    }, []);

    const handleSelectFolder = async () => {
        try {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
                await AsyncStorage.setItem('@download_folder_uri', permissions.directoryUri);
                setFolderUri(permissions.directoryUri);
                Alert.alert('✅ Éxito', 'Carpeta de descargas configurada correctamente.');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo seleccionar la carpeta.');
        }
    };

    const handleClearFolder = async () => {
        await AsyncStorage.removeItem('@download_folder_uri');
        setFolderUri(null);
        Alert.alert('Aviso', 'Se usará la carpeta interna de la aplicación (directorio del proyecto).');
    };

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>📁 Archivos y Descargas</Text>
            <Text style={st.cardSubtitle}>Configura dónde se guardarán los reportes y respaldos antes de compartirlos.</Text>
            
            <View style={st.configRow}>
                <View style={{ flex: 1 }}>
                    <Text style={st.configLabel}>Carpeta de Descargas</Text>
                    <Text style={st.configDesc} numberOfLines={1} ellipsizeMode="middle">
                        {folderUri ? folderUri : 'No configurada (usar directorio del proyecto)'}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleSelectFolder} style={st.folderBtn}>
                    <Text style={st.folderBtnText}>{folderUri ? 'Cambiar' : 'Seleccionar'}</Text>
                </TouchableOpacity>
            </View>

            {folderUri && (
                <TouchableOpacity onPress={handleClearFolder} style={{ marginTop: 12 }}>
                    <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Restablecer a valores por defecto</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};


// ─── Sub-section: Mantenimiento ───────────────────────────────────────────────
const MantenimientoSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(null);

    const handleClean = (type) => {
        Alert.alert(
            'Confirmar',
            `¿Estás seguro de que deseas limpiar los registros antiguos de ${type}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar', style: 'destructive', onPress: async () => {
                        setLoading(type);
                        try {
                            await api.delete(`/mantenimiento/${type}`);
                            Alert.alert('✅ Hecho', `Registros de ${type} eliminados.`);
                        } catch {
                            Alert.alert('Error', 'No se pudo completar la operación.');
                        } finally {
                            setLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const actions = [
        { key: 'informes', label: 'Limpiar Informes Antiguos', color: '#ef4444' },
        { key: 'asistencias', label: 'Limpiar Asistencias Antiguas', color: '#f97316' },
    ];

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>🗑️ Mantenimiento</Text>
            <Text style={st.cardSubtitle}>Elimina registros históricos para mantener la base de datos limpia.</Text>
            {actions.map(a => (
                <TouchableOpacity
                    key={a.key}
                    style={[st.dangerRow, loading === a.key && { opacity: 0.5 }]}
                    onPress={() => handleClean(a.key)}
                    disabled={!!loading}
                >
                    {loading === a.key
                        ? <ActivityIndicator size="small" color={a.color} />
                        : <Text style={[st.dangerLabel, { color: a.color }]}>{a.label}</Text>
                    }
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ─── Sub-section: Usuarios ────────────────────────────────────────────────────
const UsuariosSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>👥 Usuarios</Text>
            <Text style={st.cardSubtitle}>La gestión de usuarios (crear, editar, eliminar cuentas) está disponible únicamente en la versión web por razones de seguridad.</Text>
            <View style={st.infoBox}>
                <Text style={st.infoText}>💡 Accede desde un navegador en la misma red local para gestionar cuentas de usuario.</Text>
            </View>
        </View>
    );
};

// ─── Sub-section: Apariencia ──────────────────────────────────────────────────
const AparienciaSection = () => {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const st = getStyles(colors);

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>🎨 Apariencia</Text>
            <View style={st.configRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isDarkMode ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                    <View style={{ marginLeft: 12 }}>
                        <Text style={st.configLabel}>Tema Oscuro</Text>
                        <Text style={st.configDesc}>Activar o desactivar el modo nocturno</Text>
                    </View>
                </View>
                <Switch
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={isDarkMode ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleTheme}
                    value={isDarkMode}
                />
            </View>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ConfiguracionScreen = ({ navigation }) => {
    const [section, setSection] = useState('configuraciones');
    const { token } = useUser();

    useEffect(() => {
        // connect to Socket.IO to receive backup notifications
        if (!token) return;
        const socket = ioClient(api.defaults.baseURL, { transports: ['websocket'], auth: { token } });
        socket.on('connect', () => { });
        socket.on('backup', (data) => {
            if (data.status === 'restore_started') Alert.alert('Restauración', 'La restauración ha iniciado');
            if (data.status === 'restore_success') Alert.alert('Restauración', 'Restauración completada con éxito');
            if (data.status === 'restore_error') Alert.alert('Error', 'Error al restaurar: ' + (data.error || ''));
        });

        return () => socket.disconnect();
    }, [token]);

    const sections = [
        { key: 'configuraciones', label: 'Config.', icon: <Settings size={16} color="#fff" /> },
        { key: 'apariencia', label: 'Tema', icon: <Moon size={16} color="#fff" /> },
        { key: 'archivos', label: 'Archivos', icon: <Database size={16} color="#fff" /> },
        { key: 'gestion', label: 'Datos', icon: <Database size={16} color="#fff" /> },
        { key: 'mantenimiento', label: 'Mant.', icon: <Wrench size={16} color="#fff" /> },
        { key: 'usuarios', label: 'Usuarios', icon: <Users size={16} color="#fff" /> },
    ];

    const { colors } = useTheme();
    const st = getStyles(colors);

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
                <Text style={st.headerTitle}>Configuración</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tab bar */}
            <View style={st.tabBar}>
                {sections.map(sec => (
                    <TouchableOpacity
                        key={sec.key}
                        style={[st.tabItem, section === sec.key && st.tabItemActive]}
                        onPress={() => setSection(sec.key)}
                    >
                        <Text style={[st.tabLabel, section === sec.key && st.tabLabelActive]}>{sec.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {section === 'configuraciones' && <ConfiguracionesSection />}
                {section === 'apariencia' && <AparienciaSection />}
                {section === 'archivos' && <ArchivosSection />}
                {section === 'gestion' && <GestionDatosSection />}
                {section === 'mantenimiento' && <MantenimientoSection />}
                {section === 'usuarios' && <UsuariosSection />}
            </ScrollView>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    tabBar: {
        flexDirection: 'row', backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: colors.primary },
    tabLabel: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    cardSubtitle: { fontSize: 13, color: colors.text, marginBottom: 16, lineHeight: 18 },
    configRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    configLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
    configDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    actionIcon: { fontSize: 18, marginRight: 12 },
    actionLabel: { flex: 1, fontSize: 15, color: colors.text },
    dangerRow: {
        borderWidth: 1, borderColor: colors.danger, borderRadius: 8,
        padding: 14, marginBottom: 10, alignItems: 'center',
        backgroundColor: colors.isDarkMode ? '#450a0a' : '#fff1f2',
    },
    dangerLabel: { fontSize: 15, fontWeight: '600' },
    infoBox: { backgroundColor: colors.isDarkMode ? '#1a2a4a' : '#eff6ff', borderRadius: 8, padding: 14 },
    infoText: { fontSize: 14, color: colors.isDarkMode ? '#60a5fa' : '#1d4ed8', lineHeight: 20 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlayCentered: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalProgress: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        minWidth: 220,
    },
    modalContent: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 15,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    modalButtonCancel: {
        backgroundColor: '#ccc',
    },
    modalButtonSave: {
        backgroundColor: colors.success,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    folderBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    folderBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});

export default ConfiguracionScreen;
