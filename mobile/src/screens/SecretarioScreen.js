import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, FileText, BarChart2 } from 'lucide-react-native';
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

const ReporteView = ({ title, endpoint, renderRow }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(endpoint).then(r => setData(r.data?.data ?? [])).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator style={{ margin: 40 }} color="#3b82f6" />;
    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>{title}</Text>
            {data.length === 0
                ? <Text style={s.emptyText}>No hay datos disponibles</Text>
                : data.map((item, i) => <View key={i}>{renderRow(item, i)}</View>)
            }
        </View>
    );
};

// ─── Secretario Screen ────────────────────────────────────────────────────────
const SecretarioScreen = ({ navigation }) => {
    const [section, setSection] = useState('datos');

    const sections = [
        { key: 'datos', label: '📋 Datos Básicos' },
        { key: 's1', label: '📊 Reporte S-1' },
        { key: 's3', label: '📈 Reporte S-3' },
        { key: 's10', label: '📉 Reporte S-10' },
    ];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Secretario</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={{ paddingHorizontal: 12 }}>
                {sections.map(sec => (
                    <TouchableOpacity
                        key={sec.key}
                        style={[s.tab, section === sec.key && s.tabActive]}
                        onPress={() => setSection(sec.key)}
                    >
                        <Text style={[s.tabText, section === sec.key && s.tabTextActive]}>{sec.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {section === 'datos' && <DatosBasicos />}
                {section === 's1' && (
                    <ReporteView
                        title="Reporte S-1 — Estadísticas Mensuales"
                        endpoint={`/secretario/s1/${dayjs().add(-2, 'months').format("YYYY-MM")}-01`}
                        renderRow={(item, i) => (
                            item.subsecciones && item.subsecciones.map((sub, idx) => (
                                <View key={idx} style={s.reporteRow}>
                                    <Text style={s.reporteLabel}>{sub.label}</Text>
                                    <Text style={s.reporteValue}>{sub.valor !== undefined && sub.valor !== null ? Math.round(sub.valor * 100) / 100 : 'N/A'}</Text>
                                </View>
                            ))
                        )}
                    />
                )}
                {section === 's3' && (
                    <ReporteView
                        title="Reporte S-3 — Publicadores Activos"
                        endpoint="/secretario/s3"
                        renderRow={(item, i) => (
                            <View key={i} style={s.reporteRow}>
                                <Text style={s.reporteLabel}>{item.nombre || item.mes}</Text>
                                <Text style={s.reporteValue}>{item.total ?? item.value ?? ''}</Text>
                            </View>
                        )}
                    />
                )}
                {section === 's10' && (
                    <ReporteView
                        title="Reporte S-10 — Precursores"
                        endpoint="/secretario/s10"
                        renderRow={(item, i) => (
                            <View key={i} style={s.reporteRow}>
                                <Text style={s.reporteLabel}>{item.nombre}</Text>
                                <Text style={s.reporteValue}>{item.horas} hrs</Text>
                            </View>
                        )}
                    />
                )}
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
    tabs: { backgroundColor: '#fff', paddingVertical: 8, height: 50, maxHeight: 50 },
    tab: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#d1d5db', marginRight: 8, backgroundColor: '#f9fafb',
    },
    tabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    tabText: { fontSize: 14, color: '#374151' },
    tabTextActive: { color: '#fff', fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
    listItem: { fontSize: 15, color: '#374151', marginBottom: 6, paddingLeft: 4 },
    emptyText: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
    reporteRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    reporteLabel: { fontSize: 14, color: '#374151', flex: 1 },
    reporteValue: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
});

export default SecretarioScreen;
