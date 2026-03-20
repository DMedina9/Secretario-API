import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, FileText, BarChart2 } from 'lucide-react-native';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

dayjs.locale('es');

// ─── Sub-screens ──────────────────────────────────────────────────────────────

const DatosBasicos = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [privilegios, setPrivilegios] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/publicador/privilegios'),
            api.get('/publicador/tipos-publicador')
        ]).then(([privRes, tiposRes]) => {
            setPrivilegios(privRes.data?.data ?? []);
            setTipos(tiposRes.data?.data ?? []);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color={colors.primary} />;
    return (
        <View style={{ gap: 16 }}>
            <View style={st.card}>
                <Text style={st.cardTitle}>Privilegios</Text>
                {privilegios.map(p => <Text key={p.id} style={st.listItem}>• {p.descripcion}</Text>)}
            </View>
            <View style={st.card}>
                <Text style={st.cardTitle}>Tipos de Publicador</Text>
                {tipos.map(t => <Text key={t.id} style={st.listItem}>• {t.descripcion}</Text>)}
            </View>
        </View>
    );
};

const ReporteS1View = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { mesInforme } = useAnioServicio();
    const [currentMonth, setCurrentMonth] = useState(mesInforme);
    const [endpoint, setEndpoint] = useState(`/secretario/s1/${currentMonth.format("YYYY-MM")}-01`);

    useEffect(() => {
        api.get(endpoint).then(r => setData(r.data?.data ?? [])).catch(() => { }).finally(() => setLoading(false));
    }, [endpoint]);

    const handleMonthChange = (newMonth) => {
        setCurrentMonth(newMonth);
        setEndpoint(`/secretario/s1/${newMonth.format("YYYY-MM")}-01`);
    };

    const renderRow = (item, i) => (
        <View key={i} style={st.reporteRowContainer}>
            <Text key={i} style={st.reporteTitle}>{item.titulo}</Text>
            {item.subsecciones && item.subsecciones.map((sub, idx) => (
                <View key={idx} style={st.reporteRow}>
                    <Text style={st.reporteLabel}>{sub.label}</Text>
                    <Text style={st.reporteValue}>{sub.valor !== undefined && sub.valor !== null ? Math.round(sub.valor * 100) / 100 : 'N/A'}</Text>
                </View>
            ))}
        </View>
    );

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color={colors.primary} />;
    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>Estadísticas Mensuales</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.subtract(1, 'month'))}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{currentMonth.format('MMMM YYYY')}</Text>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.add(1, 'month'))}><ChevronRight size={24} color={colors.text} /></TouchableOpacity>
            </View>
            {data.length === 0
                ? <Text style={st.emptyText}>No hay datos disponibles</Text>
                : data.map((item, i) => <View key={i}>{renderRow(item, i)}</View>)
            }
        </View>
    );
};

const ReporteS3View = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const { anioServicio } = useAnioServicio();
    const [dataES, setDataES] = useState([]);
    const [dataFS, setDataFS] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState(anioServicio);

    useEffect(() => {
        api.get(`/secretario/s3/${currentYear}/ES`).then(r => setDataES(r.data?.data ?? [])).catch(() => { });
        api.get(`/secretario/s3/${currentYear}/FS`).then(r => setDataFS(r.data?.data ?? [])).catch(() => { }).finally(() => setLoading(false));
    }, [currentYear]);

    const handleYearChange = (newYear) => {
        setCurrentYear(newYear);
    };

    const renderData = (data, type) => (
        data && data.length > 0 && (
            <SafeAreaView style={st.card} edges={['top', 'left', 'right']}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                    <Text style={st.cardTitle}>{type === 'ES' ? 'Entre Semana' : 'Fin de Semana'} - Año {currentYear}</Text>
                </View>
                <View style={[st.row, st.headerStyle]}>
                    <Text style={[st.cell, st.headerText]}>Mes</Text>
                    <Text style={[st.cell, st.headerText]}>Año</Text>
                    <Text style={[st.cell, st.headerText]}>S1</Text>
                    <Text style={[st.cell, st.headerText]}>S2</Text>
                    <Text style={[st.cell, st.headerText]}>S3</Text>
                    <Text style={[st.cell, st.headerText]}>S4</Text>
                    <Text style={[st.cell, st.headerText]}>S5</Text>
                </View>
                {data.length === 0 ?
                    <Text style={st.headerText}>No hay datos disponibles</Text> :
                    data.map((item, index) => (
                        <View key={index} style={st.row}>
                            <Text style={st.cell}>{item.month}</Text>
                            <Text style={st.cell}>{item.year}</Text>
                            <Text style={st.cell}>{item.semana_1 || '-'}</Text>
                            <Text style={st.cell}>{item.semana_2 || '-'}</Text>
                            <Text style={st.cell}>{item.semana_3 || '-'}</Text>
                            <Text style={st.cell}>{item.semana_4 || '-'}</Text>
                            <Text style={st.cell}>{item.semana_5 || '-'}</Text>
                        </View>
                    ))}
            </SafeAreaView>
        )
    );

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color={colors.primary} />;
    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>Asistencia Anual</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{currentYear}</Text>
                <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}><ChevronRight size={24} color={colors.text} /></TouchableOpacity>
            </View>
            {renderData(dataES, 'ES')}
            {renderData(dataFS, 'FS')}
        </View>
    );
};

const ReporteS10View = () => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { anioServicio } = useAnioServicio();
    const [currentYear, setCurrentYear] = useState(anioServicio);
    const [endpoint, setEndpoint] = useState(`/secretario/s10/${currentYear}`);

    useEffect(() => {
        api.get(endpoint).then(r => setData(r.data?.data ?? [])).catch(() => { }).finally(() => setLoading(false));
    }, [endpoint]);

    const handleYearChange = (newYear) => {
        setCurrentYear(newYear);
        setEndpoint(`/secretario/s10/${newYear}`);
    };

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color={colors.primary} />;
    return (
        <View style={st.card}>
            <Text style={st.cardTitle}>Análisis de la Congregación</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{currentYear}</Text>
                <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}><ChevronRight size={24} color={colors.text} /></TouchableOpacity>
            </View>
            {data.length === 0
                ? <Text style={st.emptyText}>No hay datos disponibles</Text>
                : (
                    <View style={st.grid}>

                        {/* Asistencia */}
                        <View style={st.card}>
                            <View style={st.cardHeader}>
                                <Text style={st.cardTitle}>Promedio de Asistencia a las Reuniones</Text>
                            </View>
                            <View style={st.cardBody}>
                                <View style={st.reporteRow}>
                                    <Text style={st.reporteLabel}>Reunión del fin de semana</Text>
                                    <Text style={st.reporteValue}>{data.asistencia.fin_de_semana}</Text>
                                </View>
                                <View style={st.reporteRow}>
                                    <Text style={st.reporteLabel}>Reunión de entre semana</Text>
                                    <Text style={st.reporteValue}>{data.asistencia.entre_semana}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Territorios */}
                        <View style={st.card}>
                            <View style={st.cardHeader}>
                                <Text style={st.cardTitle}>Territorios Abarcados</Text>
                            </View>
                            <View style={st.cardBody}>
                                <View style={st.reporteRow}>
                                    <Text style={st.reporteLabel}>Número total de territorios</Text>
                                    <Text style={st.reporteValue}>{data.territorios.total}</Text>
                                </View>
                                <View style={st.reporteRow}>
                                    <Text style={st.reporteLabel}>Territorios no predicados</Text>
                                    <Text style={st.reporteValue}>{data.territorios.no_predicados}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Totales */}
                        <View style={st.card}>
                            <View style={st.cardHeader}>
                                <Text style={st.cardTitle}>Totales de la Congregación</Text>
                            </View>
                            <View style={st.cardBody}>
                                <View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Todos los publicadores activos:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.publicadores_activos}</Text>
                                    </View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Nuevos publicadores inactivos:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.nuevos_inactivos}</Text>
                                    </View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Publicadores reactivados:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.reactivados}</Text>
                                    </View>
                                </View>
                                <View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Publicadores sordos:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.sordos}</Text>
                                    </View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Publicadores ciegos:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.ciegos}</Text>
                                    </View>
                                    <View style={st.reporteRow}>
                                        <Text style={st.reporteLabel}>Publicadores encarcelados:</Text>
                                        <Text style={st.reporteValue}>{data.totales_congregacion.encarcelados}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
        </View>
    );
};

// ─── Secretario Screen ────────────────────────────────────────────────────────
const SecretarioScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [section, setSection] = useState('s1');

    const sections = [
        { key: 's1', label: '📊 S-1' },
        { key: 's3', label: '📈 S-3' },
        { key: 's10', label: '📉 S-10' },
    ];

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
                <Text style={st.headerTitle}>Secretario</Text>
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
                {section === 's1' && <ReporteS1View />}
                {section === 's3' && <ReporteS3View />}
                {section === 's10' && <ReporteS10View />}
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
    tabLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    tabLabelActive: { color: colors.primary, fontWeight: '700' },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
    listItem: { fontSize: 15, color: colors.text, marginBottom: 6, paddingLeft: 4 },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
    reporteRowContainer: {
        flexDirection: 'column', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    reporteRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    reporteTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    reporteLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
    reporteValue: { fontSize: 15, fontWeight: '700', color: colors.text },
    tableContainer: { flex: 1, backgroundColor: colors.card, borderRadius: 12, marginBottom: 16, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerStyle: { backgroundColor: colors.header },
    cell: { flex: 1, textAlign: 'center', fontSize: 14, color: colors.text },
    headerText: { fontWeight: 'bold', color: colors.text },
    flexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    flexItem: { flex: 1, textAlign: 'center', fontSize: 14, color: colors.text },
});

export default SecretarioScreen;
