import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import api from '../services/api';

dayjs.locale('es');

// ─── Attendance Form Modal ────────────────────────────────────────────────────
const AsistenciaModal = ({ visible, asistencia, onClose, onSave, onDelete }) => {
    const [fecha, setFecha] = useState('');
    const [asistentes, setAsistentes] = useState('');
    const [notas, setNotas] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setFecha(asistencia?.fecha ? dayjs(asistencia.fecha).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
            setAsistentes(asistencia?.asistentes?.toString() ?? '');
            setNotas(asistencia?.notas ?? '');
        }
    }, [visible, asistencia]);

    const handleSave = async () => {
        if (!asistentes || isNaN(asistentes)) {
            Alert.alert('Aviso', 'Ingresa un número válido de asistentes.');
            return;
        }
        setSaving(true);
        try {
            const payload = { fecha, asistentes: parseInt(asistentes, 10), notas };
            let resp;
            if (asistencia?.id) {
                resp = await api.put(`/asistencias/${asistencia.id}`, payload);
            } else {
                resp = await api.post('/asistencias/add', payload);
            }
            if (resp.data.success) onSave();
            else Alert.alert('Error', resp.data.error || 'No se pudo guardar.');
        } catch {
            Alert.alert('Error', 'Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert('Eliminar', '¿Eliminar este registro de asistencia?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: onDelete }
        ]);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.overlay}>
                <View style={s.dialog}>
                    <View style={s.dialogHeader}>
                        <Text style={s.dialogTitle}>{asistencia?.id ? 'Editar' : 'Registrar'} Asistencia</Text>
                        <TouchableOpacity onPress={onClose}><X size={22} color="#6b7280" /></TouchableOpacity>
                    </View>
                    <View style={s.fieldGroup}>
                        <Text style={s.label}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput style={s.input} value={fecha} onChangeText={setFecha} />
                    </View>
                    <View style={s.fieldGroup}>
                        <Text style={s.label}>Asistentes</Text>
                        <TextInput style={s.input} value={asistentes} onChangeText={setAsistentes} keyboardType="numeric" />
                    </View>
                    <View style={s.fieldGroup}>
                        <Text style={s.label}>Notas</Text>
                        <TextInput style={[s.input, { minHeight: 64, textAlignVertical: 'top' }]} value={notas} onChangeText={setNotas} multiline />
                    </View>
                    <View style={s.dialogFooter}>
                        {asistencia?.id && (
                            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                                <Text style={s.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.saveBtn, saving && s.disabled]} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Guardar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AsistenciasScreen = ({ navigation }) => {
    const [asistencias, setAsistencias] = useState([]);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/asistencias/all');
            setAsistencias(resp.data?.data ?? []);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar las asistencias.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selected?.id) return;
        try {
            await api.delete(`/asistencias/${selected.id}`);
            setModalVisible(false);
            setSelected(null);
            load();
        } catch {
            Alert.alert('Error', 'No se pudo eliminar.');
        }
    };

    // Build calendar grid for current month
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfWeek = currentDate.startOf('month').day(); // 0=Sun
    const cells = Array(firstDayOfWeek).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    const asistenciasByDate = {};
    asistencias.forEach(a => {
        const key = dayjs(a.fecha).format('YYYY-MM-DD');
        asistenciasByDate[key] = a;
    });

    const selectDay = (day) => {
        const dateStr = currentDate.date(day).format('YYYY-MM-DD');
        const existing = asistenciasByDate[dateStr];
        setSelected(existing ?? { fecha: dateStr });
        setModalVisible(true);
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Asistencias</Text>
                <TouchableOpacity onPress={() => { setSelected(null); setModalVisible(true); }}>
                    <Plus size={24} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={s.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {/* Month Navigator */}
                    <View style={s.monthNav}>
                        <TouchableOpacity onPress={() => setCurrentDate(d => d.subtract(1, 'month'))}>
                            <ChevronLeft size={28} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={s.monthLabel}>{currentDate.format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => setCurrentDate(d => d.add(1, 'month'))}>
                            <ChevronRight size={28} color="#1f2937" />
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={s.calGrid}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <View key={d} style={s.calDayHeader}>
                                <Text style={s.calDayHeaderText}>{d}</Text>
                            </View>
                        ))}
                        {/* Calendar cells */}
                        {cells.map((day, i) => {
                            if (!day) return <View key={`empty-${i}`} style={s.calCell} />;
                            const dateStr = currentDate.date(day).format('YYYY-MM-DD');
                            const record = asistenciasByDate[dateStr];
                            return (
                                <TouchableOpacity key={dateStr} style={[s.calCell, record && s.calCellActive]} onPress={() => selectDay(day)}>
                                    <Text style={[s.calDayNum, record && s.calDayNumActive]}>{day}</Text>
                                    {record && <Text style={s.calCount}>{record.asistentes}</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* List of this month's records */}
                    <Text style={s.sectionTitle}>Registros del mes</Text>
                    {asistencias
                        .filter(a => dayjs(a.fecha).format('YYYY-MM') === currentDate.format('YYYY-MM'))
                        .sort((a, b) => dayjs(b.fecha).diff(dayjs(a.fecha)))
                        .map(a => (
                            <TouchableOpacity
                                key={a.id}
                                style={s.asistenciaCard}
                                onPress={() => { setSelected(a); setModalVisible(true); }}
                            >
                                <View>
                                    <Text style={s.asistenciaDate}>{dayjs(a.fecha).format('dddd DD [de] MMMM')}</Text>
                                    {a.notas ? <Text style={s.asistenciaNota}>{a.notas}</Text> : null}
                                </View>
                                <View style={s.asistenciaCount}>
                                    <Text style={s.asistenciaCountText}>{a.asistentes}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    }
                </ScrollView>
            )}

            <AsistenciaModal
                visible={modalVisible}
                asistencia={selected}
                onClose={() => { setModalVisible(false); setSelected(null); }}
                onSave={() => { setModalVisible(false); setSelected(null); load(); }}
                onDelete={handleDelete}
            />
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    monthLabel: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', width: 200, textAlign: 'center', textTransform: 'capitalize' },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    calDayHeader: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
    calDayHeaderText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
    calCell: {
        width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, margin: 0,
    },
    calCellActive: { backgroundColor: '#3b82f6' },
    calDayNum: { fontSize: 15, color: '#1f2937' },
    calDayNumActive: { color: '#fff', fontWeight: 'bold' },
    calCount: { fontSize: 10, color: '#dbeafe', fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10 },
    asistenciaCard: {
        flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 14,
        alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
        elevation: 1,
    },
    asistenciaDate: { fontSize: 15, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' },
    asistenciaNota: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    asistenciaCount: { backgroundColor: '#3b82f6', borderRadius: 20, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    asistenciaCountText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
    dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dialogTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    dialogFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    fieldGroup: { marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10,
        fontSize: 15, backgroundColor: '#f9fafb', color: '#1f2937',
    },
    deleteBtn: {
        width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca',
        backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center',
    },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db' },
    cancelBtnText: { color: '#374151', fontWeight: '600' },
    saveBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    disabled: { backgroundColor: '#9ca3af' },
});

export default AsistenciasScreen;
