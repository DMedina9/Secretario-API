import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import api from '../services/api';
import DropDownPicker from 'react-native-dropdown-picker'; // Assumes this is available, if not we'll use a simpler selection or rely on it being installed
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

dayjs.locale('es');

const PrecursoresAuxiliaresScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [precursores, setPrecursores] = useState([]);
    const [publicadores, setPublicadores] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [selectedPublicadorId, setSelectedPublicadorId] = useState('');
    const [notas, setNotas] = useState('');
    const [openPublicador, setOpenPublicador] = useState(false);

    useEffect(() => {
        loadPublicadores();
        loadPrecursores(month);
    }, []);

    const loadPublicadores = async () => {
        try {
            const resp = await api.get('/publicador/all');
            const pubs = resp.data?.data ?? [];
            setPublicadores(pubs.filter(p => p.id_tipo_publicador === 1 && p.Estatus == 'Activo').sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
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
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
                <Text style={st.headerTitle}>Precursores Auxiliares</Text>
                <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                    <Plus size={22} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Filters */}
                <View style={st.filterCard}>
                    <View style={st.monthNavRow}>
                        <TouchableOpacity onPress={() => handleMonthChange(-1)}>
                            <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={st.monthLabel}>{dayjs(month + '-01').format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => handleMonthChange(1)}>
                            <ChevronRight size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {showForm && (
                    <View style={st.formCard}>
                        <Text style={st.cardTitle}>Nuevo Registro</Text>

                        <Text style={st.label}>Publicador</Text>
                        <DropDownPicker
                            open={openPublicador}
                            value={selectedPublicadorId}
                            items={[
                                { label: 'Seleccionar publicador...', value: '' },
                                ...publicadores.map(p => ({ label: `${p.apellidos}, ${p.nombre}`, value: p.id.toString() }))
                            ]}
                            setOpen={setOpenPublicador}
                            setValue={setSelectedPublicadorId}
                            searchable={true}
                            theme={colors.isDarkMode ? 'DARK' : 'LIGHT'}
                            placeholder="Seleccionar publicador"
                            style={st.pickerContainer}
                            dropDownContainerStyle={st.dropDownContainer}
                            modalContentContainerStyle={{
                                marginTop: 50,
                                paddingHorizontal: 20,
                            }}
                            listMode="MODAL"
                        />

                        <Text style={st.label}>Notas (Opcional)</Text>
                        <TextInput
                            style={st.input}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Ej. P. Aux Continuo"
                            placeholderTextColor={colors.textSecondary}
                        />

                        <View style={st.formActions}>
                            <TouchableOpacity style={[st.btn, st.btnSecondary]} onPress={() => setShowForm(false)}>
                                <Text style={st.btnTextDark}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[st.btn, st.btnPrimary, loading && st.disabled]} onPress={handleSave} disabled={loading}>
                                <Text style={st.btnText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {loading && !showForm ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    precursores.length === 0 ? (
                        <Text style={st.emptyText}>No hay precursores auxiliares registrados en este mes.</Text>
                    ) : (
                        precursores.map(p => (
                            <View key={p.id} style={st.itemCard}>
                                <View style={st.itemInfo}>
                                    <Text style={st.itemName}>{p.publicador}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={st.itemGroup}>Grupo {p.grupo}</Text>
                                        {p.notas ? <Text style={st.itemNotes}> • {p.notas}</Text> : null}
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(p.id)} style={st.deleteBtn}>
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

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
    filterCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 24, color: colors.textSecondary, paddingHorizontal: 10 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' },

    formCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, borderWidth: 1, borderColor: colors.isDarkMode ? colors.primary : '#bfdbfe' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 8 },
    pickerContainer: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.inputBackground, marginBottom: 8 },
    dropDownContainer: { borderColor: colors.border, backgroundColor: colors.inputBackground },
    picker: { height: 50 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: colors.inputBackground, color: colors.inputText },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
    btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    btnPrimary: { backgroundColor: colors.primary },
    btnSecondary: { backgroundColor: colors.isDarkMode ? '#334155' : '#e5e7eb' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    btnTextDark: { color: colors.text, fontWeight: 'bold', fontSize: 14 },
    disabled: { opacity: 0.5 },

    emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20, fontStyle: 'italic' },

    itemCard: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1, flexDirection: 'row', alignItems: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
    itemGroup: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    itemNotes: { fontSize: 13, color: colors.textSecondary },
    deleteBtn: { padding: 8, backgroundColor: colors.isDarkMode ? '#451a1a' : '#fee2e2', borderRadius: 8 },
});

export default PrecursoresAuxiliaresScreen;
