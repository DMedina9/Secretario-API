import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, Modal, TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, X, RefreshCcw } from 'lucide-react-native';
import { getAllAsistencias } from '../services/repositories/AsistenciaRepo';
import { syncAllData } from '../services/SyncService';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

dayjs.locale('es');

// ─── Attendance Form Modal ────────────────────────────────────────────────────
const AsistenciaModal = ({ visible, asistencia, onClose, onSave, onDelete }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [fecha, setFecha] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [asistentes, setAsistentes] = useState('');
    const [notas, setNotas] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (visible) {
            setFecha(asistencia?.fecha ? dayjs(asistencia.fecha).toDate() : dayjs().toDate());
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

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate && dayjs(selectedDate).toDate() || fecha;
        setFecha(currentDate);
        setShowDatePicker(false);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={st.overlay}>
                <View style={st.dialog}>
                    <View style={st.dialogHeader}>
                        <Text style={st.dialogTitle}>{asistencia?.id ? 'Editar' : 'Registrar'} Asistencia</Text>
                        <TouchableOpacity onPress={onClose}><X size={22} color={colors.textSecondary} /></TouchableOpacity>
                    </View>
                    <View style={st.fieldGroup}>
                        <Text style={st.label}>Fecha</Text>
                        <TouchableOpacity
                            style={st.input}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={st.fechaText}>{fecha.toISOString().split('T')[0]}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={fecha}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>
                    <View style={st.fieldGroup}>
                        <Text style={st.label}>Asistentes</Text>
                        <TextInput 
                            style={st.input} 
                            value={asistentes} 
                            onChangeText={setAsistentes} 
                            keyboardType="numeric" 
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                    <View style={st.fieldGroup}>
                        <Text style={st.label}>Notas</Text>
                        <TextInput 
                            style={[st.input, { minHeight: 64, textAlignVertical: 'top' }]} 
                            value={notas || ''} 
                            onChangeText={setNotas} 
                            multiline
                            numberOfLines={4} 
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>
                    <View style={st.dialogFooter}>
                        {asistencia?.id && (
                            <TouchableOpacity style={st.deleteBtn} onPress={handleDelete}>
                                <Trash2 size={18} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity style={st.cancelBtn} onPress={onClose}>
                                <Text style={st.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[st.saveBtn, saving && st.disabled]} onPress={handleSave} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.saveBtnText}>Guardar</Text>}
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
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [asistencias, setAsistencias] = useState([]);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getAllAsistencias();
            setAsistencias(data);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar las asistencias locales.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        load();
    };

    const handleDelete = async () => {
        if (!selected?.id) return;
        try {
            await api.delete(`/asistencias/${selected.id}`);
            await syncAllData(); // Refresh local DB
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
        <View style={st.container}>
            {/* Header */}
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
                <Text style={st.headerTitle}>Asistencias</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={handleSync}><RefreshCcw size={24} color="#FFFFFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelected(null); setModalVisible(true); }}>
                        <Plus size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    {/* Month Navigator */}
                    <View style={st.monthNav}>
                        <TouchableOpacity onPress={() => setCurrentDate(d => d.subtract(1, 'month'))}>
                            <ChevronLeft size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={st.monthLabel}>{currentDate.format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => setCurrentDate(d => d.add(1, 'month'))}>
                            <ChevronRight size={28} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={st.calGrid}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                            <View key={d} style={st.calDayHeader}>
                                <Text style={st.calDayHeaderText}>{d}</Text>
                            </View>
                        ))}
                        {/* Calendar cells */}
                        {cells.map((day, i) => {
                            if (!day) return <View key={`empty-${i}`} style={st.calCell} />;
                            const dateStr = currentDate.date(day).format('YYYY-MM-DD');
                            const record = asistenciasByDate[dateStr];
                            return (
                                <TouchableOpacity key={dateStr} style={[st.calCell, record && st.calCellActive]} onPress={() => selectDay(day)}>
                                    <Text style={[st.calDayNum, record && st.calDayNumActive]}>{day}</Text>
                                    {record && <Text style={st.calCount}>{record.asistentes}</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* List of this month's records */}
                    <Text style={st.sectionTitle}>Registros del mes</Text>
                    {asistencias
                        .filter(a => dayjs(a.fecha).format('YYYY-MM') === currentDate.format('YYYY-MM'))
                        .sort((a, b) => dayjs(b.fecha).diff(dayjs(a.fecha)))
                        .map(a => (
                            <TouchableOpacity
                                key={a.id}
                                style={st.asistenciaCard}
                                onPress={() => { setSelected(a); setModalVisible(true); }}
                            >
                                <View>
                                    <Text style={st.asistenciaDate}>{dayjs(a.fecha).format('dddd DD [de] MMMM')}</Text>
                                    {a.notas ? <Text style={st.asistenciaNota}>{a.notas}</Text> : null}
                                </View>
                                <View style={st.asistenciaCount}>
                                    <Text style={st.asistenciaCountText}>{a.asistentes}</Text>
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
                onSave={async () => { 
                    setModalVisible(false); 
                    setSelected(null); 
                    await syncAllData(); // Refresh local DB
                    load(); 
                }}
                onDelete={handleDelete}
            />
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
    fechaText: { alignItems: 'center', justifyContent: 'center', color: colors.text },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    monthLabel: { fontSize: 20, fontWeight: 'bold', color: colors.text, width: 200, textAlign: 'center', textTransform: 'capitalize' },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    calDayHeader: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
    calDayHeaderText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    calCell: {
        width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, margin: 0,
    },
    calCellActive: { backgroundColor: colors.primary },
    calDayNum: { fontSize: 15, color: colors.text },
    calDayNumActive: { color: '#fff', fontWeight: 'bold' },
    calCount: { fontSize: 10, color: '#dbeafe', fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
    asistenciaCard: {
        flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 14,
        alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
        elevation: 1,
    },
    asistenciaDate: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
    asistenciaNota: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    asistenciaCount: { backgroundColor: colors.primary, borderRadius: 20, width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    asistenciaCountText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    // Modal
    overlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', padding: 24 },
    dialog: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
    dialogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dialogTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    dialogFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    fieldGroup: { marginBottom: 12 },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10,
        fontSize: 15, backgroundColor: colors.inputBackground, color: colors.inputText
    },
    deleteBtn: {
        width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.danger,
        backgroundColor: colors.isDarkMode ? '#450a0a' : '#fff1f2', justifyContent: 'center', alignItems: 'center',
    },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    cancelBtnText: { color: colors.text, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    disabled: { backgroundColor: colors.textSecondary },
});

export default AsistenciasScreen;
