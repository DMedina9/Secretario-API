import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import { WebView } from 'react-native-webview';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ArrayBuffer → base64 (React Native safe, no FileReader) */
const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

/**
 * Fetch binary resource, save to cache, return { fileUri, base64 }.
 * Token is read from AsyncStorage directly (same as Axios interceptor).
 * 'x-mobile-app': 'true'  bypasses JWT check in IsAuthenticated.mjs.
 */
const downloadToCache = async (endpoint, method, body, filename) => {
    const token = await AsyncStorage.getItem('@auth_token');
    const url = `${api.defaults.baseURL}${endpoint}`;
    const options = {
        method,
        headers: {
            'x-mobile-app': 'true',
            'Authorization': `Bearer ${token}`,
        }
    };
    if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`El servidor respondió con error ${response.status}`);

    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const file = new FileSystem.File(FileSystem.Paths.cache, filename);
    file.write(base64, { encoding: 'base64' });
    return { fileUri: file.uri, base64 };
};

/** Build an HTML page that renders a PDF using PDF.js (works on Android WebView) */
const buildPdfHtml = (base64) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #525659; font-family: sans-serif; }
    #loading {
      display: flex; flex-direction: column;
      justify-content: center; align-items: center;
      height: 100vh; color: #fff; gap: 14px;
    }
    #loading p { font-size: 15px; }
    #error { display: none; color: #f87171; padding: 24px; text-align: center; }
    canvas {
      display: block; margin: 8px auto;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      background: #fff;
    }
  </style>
</head>
<body>
  <div id="loading"><p>Cargando PDF…</p></div>
  <div id="error"></div>
  <div id="container"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const base64 = "${base64}";

    // Decode base64 → Uint8Array
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

    pdfjsLib.getDocument({ data: bytes.buffer }).promise
      .then(function(pdf) {
        document.getElementById('loading').style.display = 'none';
        const container = document.getElementById('container');

        const renderPage = function(num) {
          pdf.getPage(num).then(function(page) {
            const scale = window.innerWidth / page.getViewport({ scale: 1 }).width;
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width  = viewport.width;
            canvas.height = viewport.height;
            container.appendChild(canvas);
            page.render({ canvasContext: canvas.getContext('2d'), viewport });
          });
        };
        for (let i = 1; i <= pdf.numPages; i++) renderPage(i);
      })
      .catch(function(err) {
        document.getElementById('loading').style.display = 'none';
        const el = document.getElementById('error');
        el.style.display = 'block';
        el.textContent = 'Error al renderizar: ' + err.message;
      });
  </script>
</body>
</html>`;


const shareFileUri = async (fileUri) => {
    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
    } else {
        Alert.alert('Compartir no disponible', 'La función de compartir no está disponible en este dispositivo.');
    }
};

// ─── Tab: Descargas ───────────────────────────────────────────────────────────

const DescargasTab = ({ anioServicio }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(null);

    const handleAction = async (key, endpoint, method, body, filename) => {
        setLoading(key);
        try {
            const { fileUri } = await downloadToCache(endpoint, method, body, filename);
            await shareFileUri(fileUri);
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(null);
        }
    };

    const cards = [
        {
            key: 'S21',
            title: 'Tarjetas S-21 (todos)',
            subtitle: 'ZIP con informes de todos los publicadores',
            icon: '🗂️',
            color: '#3b82f6',
            endpoint: '/reportes/get-s21',
            method: 'POST',
            body: { anio: null },
            filename: 'S21_Por_Publicador.zip',
        },
        {
            key: 'S88',
            title: `Reporte Anual S-88 (${anioServicio})`,
            subtitle: 'Archivo PDF del año de servicio',
            icon: '📄',
            color: '#ef4444',
            endpoint: `/reportes/get-s88/${anioServicio}`,
            method: 'GET',
            body: null,
            filename: `S88_${anioServicio}.pdf`,
        },
        {
            key: 'GENERAL',
            title: 'Reporte General',
            subtitle: 'Exportar todos los datos a Excel',
            icon: '📊',
            color: '#10b981',
            endpoint: '/secretario/export/template',
            method: 'GET',
            body: null,
            filename: `Reporte_General_${new Date().toISOString().slice(0, 10)}.xlsx`,
        },
    ];

    return (
        <ScrollView contentContainerStyle={st.tabContent}>
            {cards.map((c) => (
                <View key={c.key} style={st.card}>
                    <View style={st.cardRow}>
                        <Text style={st.cardIcon}>{c.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={st.cardTitle}>{c.title}</Text>
                            <Text style={st.cardSubtitle}>{c.subtitle}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[st.btn, { backgroundColor: c.color }, loading !== null && st.btnDisabled]}
                        onPress={() => handleAction(c.key, c.endpoint, c.method, c.body, c.filename)}
                        disabled={loading !== null}
                    >
                        {loading === c.key
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={st.btnText}>Descargar / Compartir</Text>
                        }
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
};

// ─── Tab: Visualizador ────────────────────────────────────────────────────────

const VisualizadorTab = ({ anioServicio }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [reportType, setReportType] = useState('S21I');
    const [year, setYear] = useState(String(anioServicio || new Date().getFullYear()));
    const [publicadores, setPublicadores] = useState([]);
    const [tiposPublicador, setTiposPublicador] = useState([]);
    const [selectedPublicadorId, setSelectedPublicadorId] = useState('');
    const [selectedTipoId, setSelectedTipoId] = useState('');
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [pdfState, setPdfState] = useState(null); // { fileUri, base64, filename }
    const [openReportType, setOpenReportType] = useState(false);
    const [openPublicador, setOpenPublicador] = useState(false);
    const [openTipo, setOpenTipo] = useState(false);

    useEffect(() => {
        const loadLists = async () => {
            try {
                const [pubs, tipos] = await Promise.all([
                    api.get('/publicador/all'),
                    api.get('/publicador/tipos-publicador'),
                ]);
                const pubData = pubs.data?.data || [];
                const tipoData = tipos.data?.data || [];
                setPublicadores(pubData);
                setTiposPublicador(tipoData);
                if (pubData.length > 0) setSelectedPublicadorId(String(pubData[0].id));
                if (tipoData.length > 0) setSelectedTipoId(String(tipoData[0].id));
            } catch (e) {
                console.error('Error cargando listas', e);
            }
        };
        loadLists();
    }, []);

    const handleGenerarPDF = async () => {
        if (!year) { Alert.alert('Aviso', 'Ingresa un año de servicio'); return; }

        let endpoint = '', method = 'GET', body = null, filename = '';

        if (reportType === 'S21I') {
            if (!selectedPublicadorId) { Alert.alert('Aviso', 'Selecciona un publicador'); return; }
            const pub = publicadores.find(p => String(p.id) === selectedPublicadorId);
            endpoint = '/reportes/get-s21';
            method = 'POST';
            body = { anio: parseInt(year), id_publicador: parseInt(selectedPublicadorId) };
            filename = pub ? `S21_${year}_${pub.nombre}_${pub.apellidos}.pdf` : `S21_${year}.pdf`;
        } else if (reportType === 'S21T') {
            if (!selectedTipoId) { Alert.alert('Aviso', 'Selecciona un tipo de publicador'); return; }
            const tipo = tiposPublicador.find(t => String(t.id) === selectedTipoId);
            endpoint = '/reportes/get-s21-totales';
            method = 'POST';
            body = { anio: parseInt(year), id_tipo_publicador: parseInt(selectedTipoId) };
            filename = tipo ? `S21_Totales_${year}_${tipo.descripcion}.pdf` : `S21_Totales_${year}.pdf`;
        } else {
            endpoint = `/reportes/get-s88/${year}`;
            filename = `S88_${year}.pdf`;
        }

        setLoadingPdf(true);
        setPdfState(null);
        try {
            const { fileUri, base64 } = await downloadToCache(endpoint, method, body, filename);
            setPdfState({ fileUri, base64, filename });
        } catch (e) {
            Alert.alert('Error', e.message);
        } finally {
            setLoadingPdf(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Show the WebView PDF viewer when PDF is loaded, otherwise show the form */}
            {pdfState ? (
                <View style={{ flex: 1 }}>
                    {/* Toolbar */}
                    <View style={st.pdfToolbar}>
                        <TouchableOpacity onPress={() => setPdfState(null)} style={st.pdfBackBtn}>
                            <Text style={st.pdfBackBtnText}>← Volver</Text>
                        </TouchableOpacity>
                        <Text style={st.pdfToolbarTitle} numberOfLines={1}>
                            {pdfState.filename}
                        </Text>
                        <TouchableOpacity onPress={() => shareFileUri(pdfState.fileUri)} style={st.pdfShareBtn}>
                            <Text style={st.pdfShareBtnText}>⬆️ Compartir</Text>
                        </TouchableOpacity>
                    </View>
                    {/* Inline PDF WebView – PDF.js renders pages as canvases */}
                    <WebView
                        style={{ flex: 1 }}
                        originWhitelist={['*']}
                        source={{ html: buildPdfHtml(pdfState.base64) }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        mixedContentMode="always"
                        allowUniversalAccessFromFileURLs={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={st.webviewLoading}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={{ marginTop: 12, color: colors.textSecondary }}>Cargando PDF…</Text>
                            </View>
                        )}
                    />
                </View>
            ) : (
                <ScrollView contentContainerStyle={st.tabContent}>
                    {/* Tipo de Reporte */}
                    <View style={st.card}>
                        <Text style={st.sectionLabel}>Tipo de Reporte</Text>
                        <DropDownPicker
                            open={openReportType}
                            value={reportType}
                            items={[
                                { label: 'S-21 (por Publicador)', value: 'S21I' },
                                { label: 'S-21 Totales (por Tipo)', value: 'S21T' },
                                { label: 'S-88 (Anual)', value: 'S88' }
                            ]}
                            setOpen={setOpenReportType}
                            setValue={setReportType}
                            searchable={true}
                            theme={colors.isDarkMode ? 'DARK' : 'LIGHT'}
                            placeholder="Seleccionar tipo de reporte"
                            style={st.pickerContainer}
                            dropDownContainerStyle={st.dropDownContainer}
                            modalContentContainerStyle={{
                                marginTop: 50, // Adds margin top to the modal list
                                paddingHorizontal: 20,
                            }}
                            listMode="MODAL"
                        />
                    </View>

                    {/* Año */}
                    <View style={st.card}>
                        <Text style={st.sectionLabel}>Año de Servicio</Text>
                        <TextInput
                            style={st.input}
                            value={year}
                            onChangeText={setYear}
                            keyboardType="numeric"
                            placeholder="Ej. 2025"
                            placeholderTextColor={colors.textSecondary}
                            maxLength={4}
                        />
                    </View>

                    {/* Selector Publicador */}
                    {reportType === 'S21I' && (
                        <View style={st.card}>
                            <Text style={st.sectionLabel}>Publicador</Text>
                            {publicadores.length === 0
                                ? <ActivityIndicator color={colors.primary} />
                                : <DropDownPicker
                                    open={openPublicador}
                                    value={selectedPublicadorId}
                                    items={publicadores.map(p => ({ label: `${p.nombre} ${p.apellidos}`, value: String(p.id) }))}
                                    setOpen={setOpenPublicador}
                                    setValue={setSelectedPublicadorId}
                                    searchable={true}
                                    theme={colors.isDarkMode ? 'DARK' : 'LIGHT'}
                                    placeholder="Seleccionar publicador"
                                    style={st.pickerContainer}
                                    dropDownContainerStyle={st.dropDownContainer}
                                    modalContentContainerStyle={{
                                        marginTop: 50, // Adds margin top to the modal list
                                        paddingHorizontal: 20,
                                    }}
                                    listMode="MODAL"
                                />
                            }
                        </View>
                    )}

                    {/* Selector Tipo Publicador */}
                    {reportType === 'S21T' && (
                        <View style={st.card}>
                            <Text style={st.sectionLabel}>Tipo de Publicador</Text>
                            {tiposPublicador.length === 0
                                ? <ActivityIndicator color={colors.primary} />
                                : <DropDownPicker
                                    open={openTipo}
                                    value={selectedTipoId}
                                    items={tiposPublicador.map(t => ({ label: t.descripcion, value: String(t.id) }))}
                                    setOpen={setOpenTipo}
                                    setValue={setSelectedTipoId}
                                    searchable={true}
                                    theme={colors.isDarkMode ? 'DARK' : 'LIGHT'}
                                    placeholder="Seleccionar tipo"
                                    style={st.pickerContainer}
                                    dropDownContainerStyle={st.dropDownContainer}
                                    modalContentContainerStyle={{
                                        marginTop: 50, // Adds margin top to the modal list
                                        paddingHorizontal: 20,
                                    }}
                                    listMode="MODAL"
                                />
                            }
                        </View>
                    )}

                    {/* Botón generar */}
                    <TouchableOpacity style={[st.btn, loadingPdf && st.btnDisabled]} onPress={handleGenerarPDF} disabled={loadingPdf}>
                        {loadingPdf ? <ActivityIndicator color="#fff" /> : <Text style={st.btnText}>👁️  Generar y Ver PDF</Text>}
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = [
    { key: 'visualizador', label: '👁️  Visualizador' },
    { key: 'descargas', label: '⬇️  Descargas' },
];

const ReportesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const { anioServicio } = useAnioServicio();
    const [activeTab, setActiveTab] = useState('visualizador');

    return (
        <SafeAreaView style={st.safeArea}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Reportes</Text>
                <View style={{ width: 32 }} />
            </View>

            <View style={st.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[st.tabItem, activeTab === tab.key && st.tabItemActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[st.tabLabel, activeTab === tab.key && st.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* flex: 1 so WebView fills remaining space */}
            <View style={{ flex: 1 }}>
                {activeTab === 'descargas'
                    ? <DescargasTab anioServicio={anioServicio} />
                    : <VisualizadorTab anioServicio={anioServicio} />
                }
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 10, backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    tabBar: {
        flexDirection: 'row', backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: colors.primary },
    tabLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },
    tabContent: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardIcon: { fontSize: 28, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.inputBackground, overflow: 'hidden' },
    dropDownContainer: { borderColor: colors.border, backgroundColor: colors.inputBackground },
    picker: { color: colors.inputText, height: 50 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: colors.inputBackground, color: colors.inputText },
    btn: { backgroundColor: colors.primary, paddingVertical: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    btnDisabled: { opacity: 0.65 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    // PDF toolbar
    pdfToolbar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.isDarkMode ? '#0f172a' : '#1f2937', paddingHorizontal: 12, paddingVertical: 10,
    },
    pdfBackBtn: { padding: 4 },
    pdfBackBtnText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    pdfToolbarTitle: { flex: 1, color: '#f9fafb', fontSize: 13, marginHorizontal: 10, textAlign: 'center' },
    pdfShareBtn: { padding: 4 },
    pdfShareBtnText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },

    // Loading overlay inside WebView
    webviewLoading: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background,
    },
});

export default ReportesScreen;
