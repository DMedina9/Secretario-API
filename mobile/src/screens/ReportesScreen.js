import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useUser } from '../contexts/UserContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FileText, Archive, Table, ArrowLeft } from 'lucide-react-native';

// Import our configured api for the base url, but we'll use fetch for binary downloads
import api from '../services/api';

const ReportesScreen = ({ navigation }) => {
    const { anioServicio } = useAnioServicio();
    const { token } = useUser();
    const [loading, setLoading] = useState(null);

    const downloadAndShareFile = async (endpoint, method = 'GET', body = null, filename) => {
        setLoading(filename);
        try {
            const url = `${api.defaults.baseURL}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            
            if (body) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }

            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error('Error al descargar el archivo desde el servidor');
            }

            const blob = await response.blob();
            
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result.split(',')[1];
                    const fileUri = `${FileSystem.documentDirectory}${filename}`;
                    
                    await FileSystem.writeAsStringAsync(fileUri, base64data, {
                        encoding: FileSystem.EncodingType.Base64
                    });
                    
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(fileUri);
                    } else {
                        Alert.alert('Éxito', 'Archivo guardado en el dispositivo, pero la opción de compartir no está disponible.');
                    }
                } catch (e) {
                    Alert.alert('Error', 'No se pudo guardar ni compartir el archivo.');
                } finally {
                    setLoading(null);
                }
            };
            
        } catch (error) {
            Alert.alert('Error', error.message);
            setLoading(null);
        }
    };

    const handleS21 = () => {
        downloadAndShareFile('/fillpdf/get-s21', 'POST', { anio: null }, 'S21_Por_Publicador.zip');
    };

    const handleS88 = () => {
        downloadAndShareFile(`/fillpdf/get-s88/${anioServicio || new Date().getFullYear()}`, 'GET', null, `S88_${anioServicio || new Date().getFullYear()}.pdf`);
    };

    const handleReporteGeneral = () => {
        downloadAndShareFile('/secretario/export/template', 'GET', null, `Reporte_General_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    return (
        <SafeAreaView style={s.safeArea}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Reportes en PDF / Excel</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Archive size={24} color="#3b82f6" style={s.icon} />
                        <View>
                            <Text style={s.cardTitle}>Tarjetas S-21</Text>
                            <Text style={s.cardSubtitle}>Descargar todos los informes en ZIP</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={[s.btn, loading === 'S21_Por_Publicador.zip' && s.btnDisabled]} 
                        onPress={handleS21}
                        disabled={loading !== null}
                    >
                        {loading === 'S21_Por_Publicador.zip' ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Descargar S-21 (ZIP)</Text>}
                    </TouchableOpacity>
                </View>

                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <FileText size={24} color="#ef4444" style={s.icon} />
                        <View>
                            <Text style={s.cardTitle}>Reporte Anual S-88</Text>
                            <Text style={s.cardSubtitle}>Año de Servicio: {anioServicio}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={[s.btn, loading && loading.includes('S88') && s.btnDisabled]} 
                        onPress={handleS88}
                        disabled={loading !== null}
                    >
                        {loading && loading.includes('S88') ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Descargar S-88 (PDF)</Text>}
                    </TouchableOpacity>
                </View>

                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Table size={24} color="#10b981" style={s.icon} />
                        <View>
                            <Text style={s.cardTitle}>Reporte General</Text>
                            <Text style={s.cardSubtitle}>Exportar datos del sistema a Excel</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={[s.btn, { backgroundColor: '#10b981' }, loading && loading.includes('Reporte_General') && s.btnDisabled]} 
                        onPress={handleReporteGeneral}
                        disabled={loading !== null}
                    >
                        {loading && loading.includes('Reporte_General') ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Descargar Reporte (XLSX)</Text>}
                    </TouchableOpacity>
                </View>
                
            </ScrollView>
        </SafeAreaView>
    );
};

const s = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 10, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    content: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: { marginRight: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    cardSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    btn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default ReportesScreen;
