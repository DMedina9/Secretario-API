import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Switch
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, MessageCircle } from 'lucide-react-native';
import api from '../services/api';

dayjs.locale('es');

// ─── Informe Row ──────────────────────────────────────────────────────────────
const InformeRow = ({ item, index, data, onChange, isFirst }) => {
    const isRP = item.id_tipo_publicador === 2;
    const prevIsRP = index > 0 && data[index - 1].id_tipo_publicador === 2;
    const showRPHeader = index === 0 && isRP;
    const showPubHeader = (index === 0 && !isRP) || (index > 0 && !isRP && prevIsRP);

    return (
        <>
            {showRPHeader && <Text style={s.groupHeader}>⭐ Precursores Regulares</Text>}
            {showPubHeader && <Text style={s.groupHeader}>👥 Publicadores</Text>}
            <View style={s.informeCard}>
                <View style={s.informeTop}>
                    <Text style={s.informeName}>{item.nombre}</Text>
                    {!item.predico_en_el_mes && item.telefono ? (
                        <View style={s.waBadge}>
                            <MessageCircle size={12} color="#25d366" />
                            <Text style={s.waText}>{item.telefono}</Text>
                        </View>
                    ) : null}
                </View>
                <View style={s.informeRow}>
                    <Text style={s.rowLabel}>Predicó</Text>
                    <Switch
                        value={!!item.predico_en_el_mes}
                        onValueChange={v => onChange(index, 'predico_en_el_mes', v ? 1 : 0)}
                        trackColor={{ true: '#3b82f6' }}
                    />
                </View>
                {!!item.predico_en_el_mes && (
                    <>
                        <View style={s.informeRow}>
                            <Text style={s.rowLabel}>Cursos Bíblicos</Text>
                            <TextInput
                                style={s.numInput}
                                keyboardType="numeric"
                                value={item.cursos_biblicos?.toString() ?? ''}
                                onChangeText={v => onChange(index, 'cursos_biblicos', parseInt(v) || 0)}
                            />
                        </View>
                        {item.id_base_tipo !== 2 && (
                            <View style={s.informeRow}>
                                <Text style={s.rowLabel}>Precursor Aux.</Text>
                                <Switch
                                    value={item.id_tipo_publicador === 3}
                                    onValueChange={v => onChange(index, 'id_tipo_publicador', v ? 3 : 1)}
                                    trackColor={{ true: '#3b82f6' }}
                                />
                            </View>
                        )}
                        {item.id_tipo_publicador !== 1 && (
                            <>
                                <View style={s.informeRow}>
                                    <Text style={s.rowLabel}>Horas</Text>
                                    <TextInput
                                        style={s.numInput}
                                        keyboardType="numeric"
                                        value={item.horas?.toString() ?? ''}
                                        onChangeText={v => onChange(index, 'horas', parseInt(v) || 0)}
                                    />
                                </View>
                                <View style={s.informeRow}>
                                    <Text style={s.rowLabel}>Horas S.S.</Text>
                                    <TextInput
                                        style={s.numInput}
                                        keyboardType="numeric"
                                        value={item.horas_SS?.toString() ?? ''}
                                        onChangeText={v => onChange(index, 'horas_SS', parseInt(v) || 0)}
                                    />
                                </View>
                            </>
                        )}
                        <View style={s.informeRow}>
                            <Text style={s.rowLabel}>Notas</Text>
                            <TextInput
                                style={[s.numInput, { width: 140, fontSize: 13 }]}
                                value={item.notas ?? ''}
                                onChangeText={v => onChange(index, 'notas', v)}
                            />
                        </View>
                    </>
                )}
            </View>
        </>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const InformesScreen = ({ navigation }) => {
    const [month, setMonth] = useState(dayjs().subtract(1, 'month').format('YYYY-MM'));
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [bulkData, setBulkData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadGroups(); }, []);

    const loadGroups = async () => {
        try {
            const resp = await api.get('/publicador/all');
            const pubs = resp.data?.data ?? [];
            const unique = [...new Set(pubs.map(p => p.grupo).filter(Boolean))].sort((a, b) => a - b);
            setGroups(unique);
        } catch (e) {
            console.error(e);
        }
    };

    const loadBulkData = async () => {
        if (!month || !selectedGroup) {
            Alert.alert('Aviso', 'Selecciona mes y grupo.');
            return;
        }
        setLoading(true);
        try {
            const pubResp = await api.get(`/publicador/grupo/${selectedGroup}`);
            const publicadores = pubResp.data?.data ?? [];
            if (!publicadores.length) { Alert.alert('Aviso', 'No hay publicadores en este grupo.'); setBulkData([]); return; }

            const monthDate = dayjs(month + '-01');
            let serviceYear = monthDate.year();
            if (monthDate.month() >= 8) serviceYear++;
            const monthStr = month.substring(5, 7);

            const existingInformes = {};
            await Promise.all(publicadores.map(async pub => {
                try {
                    const resp = await api.get(`/informe/${pub.id}/${serviceYear}/${monthStr}`);
                    const list = resp.data?.data ?? [];
                    const found = list.find(i => dayjs(i.mes).format('YYYY-MM') === month);
                    if (found) existingInformes[pub.id] = found;
                } catch (_) { }
            }));

            const sorted = publicadores.sort((a, b) => {
                const va = a.id_tipo_publicador % 2, vb = b.id_tipo_publicador % 2;
                if (va !== vb) return va - vb;
                return `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`);
            });

            setBulkData(sorted.map(pub => {
                const ex = existingInformes[pub.id];
                return {
                    id_publicador: pub.id,
                    nombre: `${pub.apellidos}, ${pub.nombre}`,
                    telefono: pub.telefono_movil,
                    mes: month + '-01',
                    predico_en_el_mes: ex ? ex.predico_en_el_mes : 0,
                    horas: ex ? ex.horas : 0,
                    horas_SS: ex ? ex.horas_SS : 0,
                    cursos_biblicos: ex ? ex.cursos_biblicos : 0,
                    id_base_tipo: pub.id_tipo_publicador,
                    id_tipo_publicador: ex ? ex.id_tipo_publicador : (pub.id_tipo_publicador || 1),
                    notas: ex ? ex.notas : ''
                };
            }));
        } catch (e) {
            Alert.alert('Error', 'Error al cargar datos.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        setBulkData(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSave = async () => {
        if (!bulkData.length) return;
        setLoading(true);
        try {
            const payload = bulkData.map(item => ({
                id_publicador: item.id_publicador,
                mes: item.mes,
                predico_en_el_mes: item.predico_en_el_mes ? 1 : 0,
                horas: parseInt(item.horas) || 0,
                horas_SS: parseInt(item.horas_SS) || 0,
                cursos_biblicos: parseInt(item.cursos_biblicos) || 0,
                id_tipo_publicador: parseInt(item.id_tipo_publicador),
                notas: item.notas
            }));
            const resp = await api.post('/informe/bulk', payload);
            if (resp.data?.success) {
                Alert.alert('✅ Guardado', `${bulkData.length} informes guardados.`);
                setBulkData([]);
            }
        } catch {
            Alert.alert('Error', 'Error al guardar informes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Informes de Predicación</Text>
                {bulkData.length > 0 ? (
                    <TouchableOpacity onPress={handleSave}><Save size={24} color="#3b82f6" /></TouchableOpacity>
                ) : <View style={{ width: 24 }} />}
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Filters */}
                <View style={s.filterCard}>
                    <View style={s.monthNavRow}>
                        <TouchableOpacity onPress={() => setMonth(m => dayjs(m + '-01').subtract(1, 'month').format('YYYY-MM'))}>
                            <ChevronLeft size={26} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={s.monthLabel}>{dayjs(month + '-01').format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => setMonth(m => dayjs(m + '-01').add(1, 'month').format('YYYY-MM'))}>
                            <ChevronRight size={26} color="#1f2937" />
                        </TouchableOpacity>
                    </View>
                    <Text style={s.filterLabel}>Grupo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {groups.map(g => (
                            <TouchableOpacity
                                key={g}
                                style={[s.groupChip, selectedGroup === g && s.groupChipActive]}
                                onPress={() => setSelectedGroup(g)}
                            >
                                <Text style={[s.groupChipText, selectedGroup === g && s.groupChipTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={[s.applyBtn, loading && s.disabled]} onPress={loadBulkData} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.applyBtnText}>Cargar Informes</Text>}
                    </TouchableOpacity>
                </View>

                {bulkData.map((item, index) => (
                    <InformeRow key={item.id_publicador} item={item} index={index} data={bulkData} onChange={handleFieldChange} />
                ))}

                {bulkData.length > 0 && (
                    <TouchableOpacity style={[s.applyBtn, { marginTop: 8 }, loading && s.disabled]} onPress={handleSave} disabled={loading}>
                        <Text style={s.applyBtnText}>💾 Guardar Todos ({bulkData.length})</Text>
                    </TouchableOpacity>
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1, textAlign: 'center' },
    filterCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', width: 180, textAlign: 'center', textTransform: 'capitalize' },
    filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    groupChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', marginRight: 8,
    },
    groupChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    groupChipText: { fontSize: 14, color: '#374151' },
    groupChipTextActive: { color: '#fff', fontWeight: '600' },
    applyBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center' },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    disabled: { backgroundColor: '#9ca3af' },
    groupHeader: {
        fontSize: 14, fontWeight: 'bold', color: '#3b82f6', backgroundColor: '#eff6ff',
        padding: 10, borderRadius: 8, marginBottom: 4,
    },
    informeCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
    informeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    informeName: { fontSize: 15, fontWeight: '700', color: '#1f2937', flex: 1 },
    waBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    waText: { fontSize: 12, color: '#25d366' },
    informeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: '#6b7280' },
    numInput: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 6,
        width: 80, fontSize: 15, textAlign: 'center', color: '#1f2937', backgroundColor: '#f9fafb',
    },
});

export default InformesScreen;
