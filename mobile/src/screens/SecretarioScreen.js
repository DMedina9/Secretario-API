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
import api from '../services/api';

dayjs.locale('es');

// ─── Sub-screens ──────────────────────────────────────────────────────────────

const DatosBasicos = () => {
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

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color="#3b82f6" />;
    return (
        <View style={{ gap: 16 }}>
            <View style={s.card}>
                <Text style={s.cardTitle}>Privilegios</Text>
                {privilegios.map(p => <Text key={p.id} style={s.listItem}>• {p.descripcion}</Text>)}
            </View>
            <View style={s.card}>
                <Text style={s.cardTitle}>Tipos de Publicador</Text>
                {tipos.map(t => <Text key={t.id} style={s.listItem}>• {t.descripcion}</Text>)}
            </View>
        </View>
    );
};

const ReporteS1View = () => {
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
        <View key={i} style={s.reporteRowContainer}>
            <Text key={i} style={s.reporteTitle}>{item.titulo}</Text>
            {item.subsecciones && item.subsecciones.map((sub, idx) => (
                <View key={idx} style={s.reporteRow}>
                    <Text style={s.reporteLabel}>{sub.label}</Text>
                    <Text style={s.reporteValue}>{sub.valor !== undefined && sub.valor !== null ? Math.round(sub.valor * 100) / 100 : 'N/A'}</Text>
                </View>
            ))}
        </View>
    );

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color="#3b82f6" />;
    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>S-1 — Estadísticas Mensuales</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.subtract(1, 'month'))}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{currentMonth.format('MMMM YYYY')}</Text>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.add(1, 'month'))}><ChevronRight size={24} color="#1f2937" /></TouchableOpacity>
            </View>
            {data.length === 0
                ? <Text style={s.emptyText}>No hay datos disponibles</Text>
                : data.map((item, i) => <View key={i}>{renderRow(item, i)}</View>)
            }
        </View>
    );
};

const ReporteS3View = () => {
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
            <SafeAreaView style={s.card} edges={['top', 'left', 'right']}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={s.cardTitle}>{type === 'ES' ? 'Entre Semana' : 'Fin de Semana'} - Año {currentYear}</Text>
                </View>
                <View style={[s.row, s.header]}>
                    <Text style={[s.cell, s.headerText]}>Mes</Text>
                    <Text style={[s.cell, s.headerText]}>Año</Text>
                    <Text style={[s.cell, s.headerText]}>S1</Text>
                    <Text style={[s.cell, s.headerText]}>S2</Text>
                    <Text style={[s.cell, s.headerText]}>S3</Text>
                    <Text style={[s.cell, s.headerText]}>S4</Text>
                    <Text style={[s.cell, s.headerText]}>S5</Text>
                </View>
                {data.length === 0 ?
                    <Text style={s.headerText}>No hay datos disponibles</Text> :
                    data.map((item, index) => (
                        <View key={index} style={s.row}>
                            <Text style={s.cell}>{item.month}</Text>
                            <Text style={s.cell}>{item.year}</Text>
                            <Text style={s.cell}>{item.semana_1 || '-'}</Text>
                            <Text style={s.cell}>{item.semana_2 || '-'}</Text>
                            <Text style={s.cell}>{item.semana_3 || '-'}</Text>
                            <Text style={s.cell}>{item.semana_4 || '-'}</Text>
                            <Text style={s.cell}>{item.semana_5 || '-'}</Text>
                        </View>
                    ))}
            </SafeAreaView>
        )
    );

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color="#3b82f6" />;
    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>S-3 — Asistencia Anual</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{currentYear}</Text>
                <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}><ChevronRight size={24} color="#1f2937" /></TouchableOpacity>
            </View>
            {renderData(dataES, 'ES')}
            {renderData(dataFS, 'FS')}
        </View>
    );
};

const ReporteS10View = () => {
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

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color="#3b82f6" />;
    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>S-10 — Análisis de la Congregación</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 16, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{currentYear}</Text>
                <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}><ChevronRight size={24} color="#1f2937" /></TouchableOpacity>
            </View>
            {data.length === 0
                ? <Text style={s.emptyText}>No hay datos disponibles</Text>
                : (
                    <View style={s.grid}>

                        {/* Asistencia */}
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Text style={s.cardTitle}>Promedio de Asistencia a las Reuniones</Text>
                            </View>
                            <View style={s.cardBody}>
                                <View style={s.reporteRow}>
                                    <Text style={s.reporteLabel}>Reunión del fin de semana</Text>
                                    <Text style={s.reporteValue}>{data.asistencia.fin_de_semana}</Text>
                                </View>
                                <View style={s.reporteRow}>
                                    <Text style={s.reporteLabel}>Reunión de entre semana</Text>
                                    <Text style={s.reporteValue}>{data.asistencia.entre_semana}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Territorios */}
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Text style={s.cardTitle}>Territorios Abarcados</Text>
                            </View>
                            <View style={s.cardBody}>
                                <View style={s.reporteRow}>
                                    <Text style={s.reporteLabel}>Número total de territorios</Text>
                                    <Text style={s.reporteValue}>{data.territorios.total}</Text>
                                </View>
                                <View style={s.reporteRow}>
                                    <Text style={s.reporteLabel}>Territorios no predicados</Text>
                                    <Text style={s.reporteValue}>{data.territorios.no_predicados}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Totales */}
                        <View style={s.card}>
                            <View style={s.cardHeader}>
                                <Text style={s.cardTitle}>Totales de la Congregación</Text>
                            </View>
                            <View style={s.cardBody}>
                                <View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Todos los publicadores activos:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.publicadores_activos}</Text>
                                    </View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Nuevos publicadores inactivos:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.nuevos_inactivos}</Text>
                                    </View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Publicadores reactivados:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.reactivados}</Text>
                                    </View>
                                </View>
                                <View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Publicadores sordos:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.sordos}</Text>
                                    </View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Publicadores ciegos:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.ciegos}</Text>
                                    </View>
                                    <View style={s.reporteRow}>
                                        <Text style={s.reporteLabel}>Publicadores encarcelados:</Text>
                                        <Text style={s.reporteValue}>{data.totales_congregacion.encarcelados}</Text>
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
    const [section, setSection] = useState('s1');

    const sections = [
        { key: 's1', label: '📊 S-1' },
        { key: 's3', label: '📈 S-3' },
        { key: 's10', label: '📉 S-10' },
    ];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Secretario</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tab bar */}
            <View style={s.tabBar}>
                {sections.map(sec => (
                    <TouchableOpacity
                        key={sec.key}
                        style={[s.tabItem, section === sec.key && s.tabItemActive]}
                        onPress={() => setSection(sec.key)}
                    >
                        <Text style={[s.tabLabel, section === sec.key && s.tabLabelActive]}>{sec.label}</Text>
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

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    tabBar: {
        flexDirection: 'row', backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: '#3b82f6' },
    tabLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    tabLabelActive: { color: '#3b82f6', fontWeight: '700' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
    listItem: { fontSize: 15, color: '#374151', marginBottom: 6, paddingLeft: 4 },
    emptyText: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
    reporteRowContainer: {
        flexDirection: 'column', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    reporteRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    reporteTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    reporteLabel: { fontSize: 14, color: '#374151', flex: 1 },
    reporteValue: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
    tableContainer: { flex: 1, backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ccc', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
    cell: { flex: 1, textAlign: 'center', fontSize: 14, color: '#374151' },
    headerText: { fontWeight: 'bold', color: '#1f2937' },
    flexRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
    flexItem: { flex: 1, textAlign: 'center', fontSize: 14, color: '#374151' },
});

export default SecretarioScreen;
