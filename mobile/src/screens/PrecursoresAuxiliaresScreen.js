import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import api from '../services/api';
import { Picker } from '@react-native-picker/picker'; // Assumes this is available, if not we'll use a simpler selection or rely on it being installed
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';

dayjs.locale('es');

const PrecursoresAuxiliaresScreen = ({ navigation }) => {
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [precursores, setPrecursores] = useState([]);
    const [publicadores, setPublicadores] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form Modal Equivalent State
    const [showForm, setShowForm] = useState(false);
    const [selectedPublicadorId, setSelectedPublicadorId] = useState('');
    const [notas, setNotas] = useState('');

    useEffect(() => {
        loadPublicadores();
        loadPrecursores(month);
    }, []);

    const loadPublicadores = async () => {
        try {
            const resp = await api.get('/publicador/all');
            const pubs = resp.data?.data ?? [];
            setPublicadores(pubs.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        } catch (e) {
            console.error(e);
        }
    };

    const loadPrecursores = async (selectedMonth) => {
        setLoading(true);
        try {
            const date = dayjs(selectedMonth + '-01');
            let serviceYear = date.year();
            if (date.month() >= 8) serviceYear++;

            const resp = await api.get(`/precursoresAuxiliares/${serviceYear}/${date.format('MM')}`);
            if (resp.data && resp.data.success) {
                setPrecursores(resp.data.data);
            } else {
                setPrecursores([]);
            }
        } catch (e) {
            console.error('Error loading PA:', e);
            Alert.alert('Error', 'No se pudieron cargar los precursores auxiliares.');
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (direction) => {
        const newMonth = dayjs(month + '-01').add(direction, 'month').format('YYYY-MM');
        setMonth(newMonth);
        loadPrecursores(newMonth);
    };

    const handleSave = async () => {
        if (!selectedPublicadorId) {
            Alert.alert('Aviso', 'Selecciona un publicador.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                mes: month + '-01',
                id_publicador: parseInt(selectedPublicadorId),
                notas: notas
            };

            const resp = await api.post('/precursoresAuxiliares/add', payload);
            if (resp.data?.success) {
                Alert.alert('✅ Éxito', 'Precursor auxiliar registrado.');
                setShowForm(false);
                setSelectedPublicadorId('');
                setNotas('');
                loadPrecursores(month);
            } else {
                Alert.alert('Error', resp.data?.error || 'Error al guardar.');
            }
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar el registro.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirmar',
            '¿Eliminar este registro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const resp = await api.delete(`/precursoresAuxiliares/${id}`);
                            if (resp.data?.success) {
                                loadPrecursores(month);
                            } else {
                                Alert.alert('Error', 'No se pudo eliminar.');
                            }
                        } catch (e) {
                            Alert.alert('Error', 'Error de conexión.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Precursores Auxiliares</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                    <Plus size={22} color="#6b7280" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Filters */}
                <View style={s.filterCard}>
                    <View style={s.monthNavRow}>
                        <TouchableOpacity onPress={() => handleMonthChange(-1)}>
                            <ChevronLeft size={24} color="#1f2937" />
                        </TouchableOpacity>
                        <Text style={s.monthLabel}>{dayjs(month + '-01').format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => handleMonthChange(1)}>
                            <ChevronRight size={24} color="#1f2937" />
                        </TouchableOpacity>
                    </View>
                </View>

                {showForm && (
                    <View style={s.formCard}>
                        <Text style={s.cardTitle}>Nuevo Registro</Text>

                        <Text style={s.label}>Publicador</Text>
                        <View style={s.pickerContainer}>
                            {/* Simple mapping if Picker is not available, but Picker is standard */}
                            <Picker
                                selectedValue={selectedPublicadorId}
                                onValueChange={(itemValue) => setSelectedPublicadorId(itemValue)}
                                style={s.picker}
                            >
                                <Picker.Item label="Seleccionar publicador..." value="" />
                                {publicadores.map(p => (
                                    <Picker.Item key={p.id} label={`${p.apellidos}, ${p.nombre}`} value={p.id.toString()} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={s.label}>Notas (Opcional)</Text>
                        <TextInput
                            style={s.input}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Ej. P. Aux Continuo"
                        />

                        <View style={s.formActions}>
                            <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={() => setShowForm(false)}>
                                <Text style={s.btnTextDark}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.btn, s.btnPrimary, loading && s.disabled]} onPress={handleSave} disabled={loading}>
                                <Text style={s.btnText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {loading && !showForm ? (
                    <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                ) : (
                    precursores.length === 0 ? (
                        <Text style={s.emptyText}>No hay precursores auxiliares registrados en este mes.</Text>
                    ) : (
                        precursores.map(p => (
                            <View key={p.id} style={s.itemCard}>
                                <View style={s.itemInfo}>
                                    <Text style={s.itemName}>{p.publicador}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={s.itemGroup}>Grupo {p.grupo}</Text>
                                        {p.notas ? <Text style={s.itemNotes}> • {p.notas}</Text> : null}
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(p.id)} style={s.deleteBtn}>
                                    <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )
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
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 24, color: '#4b5563', paddingHorizontal: 10 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', textTransform: 'capitalize' },

    formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: '#bfdbfe' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e40af', marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
    pickerContainer: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb', marginBottom: 8 },
    picker: { height: 50 },
    input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9fafb', color: '#1f2937' },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: '#3b82f6' },
    btnSecondary: { backgroundColor: '#e5e7eb' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    btnTextDark: { color: '#374151', fontWeight: 'bold', fontSize: 14 },
    disabled: { opacity: 0.5 },

    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20, fontStyle: 'italic' },

    itemCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    itemGroup: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
    itemNotes: { fontSize: 13, color: '#6b7280' },
    deleteBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
});

export default PrecursoresAuxiliaresScreen;
