import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal, TextInput, Switch
} from 'react-native';
import { ArrowLeft, Settings, Database, Wrench, Users, ChevronRight, Moon, Sun } from 'lucide-react-native';
import { getAllConfiguraciones, saveConfiguracion } from '../services/repositories/ConfiguracionesRepo';
import { Informes, Asistencias, PrecursoresAuxiliares, Publicadores } from '../services/models';
import { useTheme } from '../contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FileService from '../services/FileService';
import { generateTemplateXLSX, importExcelFromUri } from '../services/ImportExcelService';


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
            const success = await saveConfiguracion(selectedConfig, inputValue);
            if (success) {
                Alert.alert('Éxito', 'Configuración guardada.');
                setIsModalVisible(false);
                fetchConfiguraciones();
            } else {
                Alert.alert('Error', 'No se pudo guardar.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Error al guardar.');
        }
    };

    return (
        <View style={st.card}>
            <View style={st.headerRow}>
                <Text style={st.cardTitle}>⚙️ Configuraciones del Sistema</Text>
            </View>
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

// ─── Sub-section: Gestión de Datos (Offline) ──────────────────────────────────
const GestionDatosSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(null);
    const [isExcelModalVisible, setIsExcelModalVisible] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importMessage, setImportMessage] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const downloadBackup = async () => {
        setLoading('backup');
        try {
            const dbName = 'secretario.db';
            const dbUri = `${FileSystem.documentDirectory}SQLite/${dbName}`;
            
            // Generate a backup with timestamp
            const backupFilename = `respaldo_secretario_${new Date().toISOString().split('T')[0]}.db`;
            const backupUri = `${FileSystem.cacheDirectory}${backupFilename}`;
            
            await FileSystem.copyAsync({ from: dbUri, to: backupUri });
            await FileService.saveAndShareFile(backupUri, backupFilename);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo crear el respaldo de la base de datos.');
        } finally {
            setLoading(null);
        }
    };

    const restoreBackup = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            if (result.canceled) return;

            Alert.alert(
                'Confirmar Restauración',
                'Esto reemplazará todos los datos actuales por los del archivo seleccionado. La aplicación podría necesitar reiniciarse. ¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Restaurar', style: 'destructive', onPress: async () => {
                            setLoading('restore');
                            try {
                                const dbName = 'secretario.db';
                                const destUri = `${FileSystem.documentDirectory}SQLite/${dbName}`;
                                
                                // Ensure the SQLite directory exists
                                const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
                                const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
                                if (!dirInfo.exists) {
                                    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
                                }

                                await FileSystem.copyAsync({
                                    from: result.assets[0].uri,
                                    to: destUri
                                });

                                Alert.alert('Éxito', 'Restauración completada. Por favor reinicia la aplicación para ver los cambios.');
                            } catch (e) {
                                console.error(e);
                                Alert.alert('Error', 'No se pudo restaurar el archivo. Asegúrate de que es un archivo de base de datos válido.');
                            } finally {
                                setLoading(null);
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const b64 = generateTemplateXLSX();
            const filename = 'Plantilla_Carga_Inicial.xlsx';
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;
            await FileSystem.writeAsStringAsync(fileUri, b64, { encoding: FileSystem.EncodingType.Base64 });
            await FileService.saveAndShareFile(fileUri, filename);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo generar o compartir la plantilla de Excel.');
        }
    };

    const handleImportExcel = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            if (result.canceled) return;

            Alert.alert(
                'Confirmar Importación',
                '¿Deseas importar los datos del archivo seleccionado? Esto agregará nuevos publicadores, informes y asistencias, y actualizará los existentes con la misma información clave.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Importar',
                        onPress: async () => {
                            setIsImporting(true);
                            setImportProgress(0);
                            setImportMessage('Iniciando importación...');
                            try {
                                const response = await importExcelFromUri(result.assets[0].uri, (progress, message) => {
                                    setImportProgress(progress);
                                    setImportMessage(message);
                                });

                                Alert.alert(
                                    'Carga Exitosa',
                                    `Importación completada con éxito:\n\n- Publicadores: ${response.publicadoresImportados}\n- Informes: ${response.informesImportados}\n- Asistencias: ${response.asistenciasImportadas}`
                                );
                                setIsExcelModalVisible(false);
                            } catch (e) {
                                console.error(e);
                                Alert.alert('Error de Importación', e.message || 'Ocurrió un error al importar el archivo Excel.');
                            } finally {
                                setIsImporting(false);
                                setImportProgress(0);
                                setImportMessage('');
                            }
                        }
                    }
                ]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo abrir el selector de archivos.');
        }
    };

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>📊 Gestión de Datos Local</Text>
            <Text style={st.cardSubtitle}>Respalda, restaura o importa tu información directamente en este dispositivo.</Text>
            
            <Modal
                visible={loading === 'restore' || loading === 'backup'}
                transparent
                animationType="fade"
            >
                <View style={st.modalOverlayCentered}>
                    <View style={st.modalProgress}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={{ marginTop: 12, color: colors.text }}>
                            {loading === 'backup' ? 'Creando respaldo...' : 'Restaurando datos...'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Modal de Carga Excel */}
            <Modal
                visible={isExcelModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    if (!isImporting) setIsExcelModalVisible(false);
                }}
            >
                <View style={st.modalOverlay}>
                    <View style={[st.modalContent, { width: '90%', maxHeight: '85%' }]}>
                        <Text style={st.modalTitle}>📊 Carga Inicial desde Excel</Text>
                        
                        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                            <Text style={st.instructionHeading}>Instrucciones de llenado:</Text>
                            
                            <Text style={st.instructionText}>
                                1. **Descarga la plantilla**: Toca el botón de abajo para guardar o compartir la plantilla vacía en tu dispositivo.
                            </Text>
                            <Text style={st.instructionText}>
                                2. **Hojas requeridas**: La plantilla contiene tres pestañas importantes que debes conservar sin cambiar sus nombres:
                            </Text>
                            
                            <View style={st.bulletContainer}>
                                <Text style={st.bulletText}>• **Publicadores**: Registro de personas. El campo **Nombre** debe tener el formato `Apellidos, Nombre` (ej: `Pérez, Juan`). El campo **Sexo** acepta `Hombre` o `Mujer`. Los privilegios admitidos son `Anciano` y `Siervo ministerial`. Los tipos de publicador son `Publicador`, `Precursor regular` o `Precursor auxiliar`.</Text>
                                <Text style={st.bulletText}>• **Informes**: Historial mensual. Asegúrate de que los nombres coincidan exactamente con la hoja de Publicadores. El formato de **Mes** debe ser una fecha o texto `AAAA-MM-DD` (ej: `2025-01-01`).</Text>
                                <Text style={st.bulletText}>• **Asistencias**: Registro de asistencia a las reuniones. La **Fecha** debe tener formato `AAAA-MM-DD`.</Text>
                            </View>

                            <Text style={st.instructionText}>
                                3. **Formatos**: No cambies los encabezados de las columnas. Las fechas deben ingresarse idealmente en formato `AAAA-MM-DD`. Los valores lógicos de Sí/No como "Ungido" o "Predicó en el mes" deben ingresarse como `TRUE` o `FALSE`.
                            </Text>
                            
                            <Text style={st.instructionText}>
                                4. **Importación**: Una vez que llenes el archivo, pulsa el botón **Seleccionar y Cargar** para proceder.
                            </Text>
                        </ScrollView>

                        {isImporting ? (
                            <View style={st.progressContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={st.progressText}>{importMessage}</Text>
                                <View style={st.progressBarBg}>
                                    <View style={[st.progressBarFg, { width: `${importProgress}%` }]} />
                                </View>
                                <Text style={st.progressPercent}>{importProgress}%</Text>
                            </View>
                        ) : (
                            <View style={st.modalButtonsExcel}>
                                <TouchableOpacity
                                    style={[st.excelButton, { backgroundColor: '#3b82f6' }]}
                                    onPress={handleDownloadTemplate}
                                >
                                    <Text style={st.excelButtonText}>📥 Descargar Plantilla</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[st.excelButton, { backgroundColor: colors.success }]}
                                    onPress={handleImportExcel}
                                >
                                    <Text style={st.excelButtonText}>📁 Seleccionar y Cargar</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {!isImporting && (
                            <TouchableOpacity
                                style={st.closeExcelBtn}
                                onPress={() => setIsExcelModalVisible(false)}
                            >
                                <Text style={st.closeExcelBtnText}>Cerrar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>

            <TouchableOpacity
                style={[st.actionRow, loading === 'backup' && { opacity: 0.5 }]}
                onPress={downloadBackup}
                disabled={!!loading}
            >
                <Text style={st.actionIcon}>💾</Text>
                <Text style={st.actionLabel}>Crear Respaldo (Exportar .db)</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={[st.actionRow, loading === 'restore' && { opacity: 0.5 }]}
                onPress={restoreBackup}
                disabled={!!loading}
            >
                <Text style={st.actionIcon}>🔁</Text>
                <Text style={st.actionLabel}>Restaurar desde Archivo (.db)</Text>
                <ChevronRight size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
                style={st.actionRow}
                onPress={() => setIsExcelModalVisible(true)}
                disabled={!!loading}
            >
                <Text style={st.actionIcon}>📥</Text>
                <Text style={st.actionLabel}>Carga Inicial desde Excel (.xlsx)</Text>
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
        Alert.alert('Aviso', 'Se usará la carpeta interna de la aplicación.');
    };

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>📁 Archivos y Descargas</Text>
            <Text style={st.cardSubtitle}>Configura dónde se guardarán los reportes y respaldos.</Text>
            
            <View style={st.configRow}>
                <View style={{ flex: 1 }}>
                    <Text style={st.configLabel}>Carpeta de Descargas</Text>
                    <Text style={st.configDesc} numberOfLines={1} ellipsizeMode="middle">
                        {folderUri ? folderUri : 'Interna del sistema'}
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

// ─── Sub-section: Mantenimiento (Local) ───────────────────────────────────────
const MantenimientoSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(null);

    const handleClean = (type) => {
        Alert.alert(
            'Confirmar Limpieza',
            `¿Estás seguro de que deseas eliminar permanentemente todos los registros de ${type}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive', onPress: async () => {
                        setLoading(type);
                        try {
                            if (type === 'informes') await Informes.destroy({ where: {}, truncate: true });
                            else if (type === 'asistencias') await Asistencias.destroy({ where: {}, truncate: true });
                            else if (type === 'publicadores') await Publicadores.destroy({ where: {}, truncate: true });
                            else if (type === 'precursores') await PrecursoresAuxiliares.destroy({ where: {}, truncate: true });
                            
                            Alert.alert('✅ Hecho', `Registros de ${type} eliminados exitosamente.`);
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'No se pudo completar la operación local.');
                        } finally {
                            setLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const actions = [
        { key: 'informes', label: 'Borrar Todos los Informes', color: '#ef4444' },
        { key: 'asistencias', label: 'Borrar Todas las Asistencias', color: '#f97316' },
        { key: 'precursores', label: 'Borrar Precursores Auxiliares', color: '#3b82f6' },
        { key: 'publicadores', label: 'Borrar Todos los Publicadores', color: '#ef4444' },
    ];

    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>🗑️ Mantenimiento Local</Text>
            <Text style={st.cardSubtitle}>Elimina registros locales para liberar espacio o reiniciar datos.</Text>
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

// ─── Sub-section: Usuarios (Eliminado) ─────────────────────────────────────────
const InfoVersionSection = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>ℹ️ Información</Text>
            <Text style={st.cardSubtitle}>Esta aplicación funciona de manera 100% offline. Tu información se guarda exclusivamente en este dispositivo.</Text>
            <View style={st.infoBox}>
                <Text style={st.infoText}>💡 Recuerda realizar respaldos periódicos usando la opción de "Gestión de Datos Local".</Text>
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

    const sections = [
        { key: 'configuraciones', label: 'Config.', icon: <Settings size={16} /> },
        { key: 'apariencia', label: 'Tema', icon: <Moon size={16} /> },
        { key: 'archivos', label: 'Archivos', icon: <Database size={16} /> },
        { key: 'gestion', label: 'Datos', icon: <Database size={16} /> },
        { key: 'mantenimiento', label: 'Mant.', icon: <Wrench size={16} /> },
        { key: 'info', label: 'Info', icon: <Users size={16} /> },
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
                {section === 'info' && <InfoVersionSection />}
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
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
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
    instructionHeading: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 12,
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 10,
        lineHeight: 18,
    },
    bulletContainer: {
        paddingLeft: 10,
        marginBottom: 10,
    },
    bulletText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 6,
        lineHeight: 17,
    },
    progressContainer: {
        alignItems: 'center',
        marginTop: 15,
        width: '100%',
    },
    progressText: {
        fontSize: 13,
        color: colors.text,
        marginTop: 8,
        textAlign: 'center',
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: colors.border,
        borderRadius: 3,
        marginTop: 10,
    },
    progressBarFg: {
        height: 6,
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 4,
    },
    modalButtonsExcel: {
        flexDirection: 'column',
        gap: 10,
        marginTop: 15,
        width: '100%',
    },
    excelButton: {
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    excelButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    closeExcelBtn: {
        marginTop: 15,
        paddingVertical: 10,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        width: '100%',
    },
    closeExcelBtnText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 14,
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
