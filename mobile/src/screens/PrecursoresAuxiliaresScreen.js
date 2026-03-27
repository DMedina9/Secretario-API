import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, FlatList
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import api from '../services/api';
import DropDownPicker from 'react-native-dropdown-picker'; // Assumes this is available, if not we'll use a simpler selection or rely on it being installed
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, RefreshCcw, Edit, CheckSquare, Square, Save, X } from 'lucide-react-native';
import { getAllPublicadores } from '../services/repositories/PublicadorRepo';
import { getPrecursoresAuxiliaresByMonth, savePrecursorAuxiliar, deletePrecursorAuxiliar } from '../services/repositories/InformeRepo';
import { syncAllData, pushEntityChanges } from '../services/SyncService';
import { PrecursorAuxiliar } from '../services/models';
import { Send } from 'lucide-react-native';
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

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        loadPublicadores();
        loadPrecursores(month);
    }, []);

    const loadPublicadores = async () => {
        try {
            const pubs = await getAllPublicadores();
            setPublicadores(pubs.filter(p => p.id_tipo_publicador === 1 && p.Estatus == 'Activo').sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
        } catch (e) {
            console.error(e);
        }
    };

    const loadPrecursores = async (selectedMonth) => {
        setLoading(true);
        try {
            const data = await getPrecursoresAuxiliaresByMonth(selectedMonth + '-01');
            setPrecursores(data);
        } catch (e) {
            console.error('Error loading PA locally:', e);
            Alert.alert('Error', 'No se pudieron cargar los precursores auxiliares locales.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        loadPublicadores();
        loadPrecursores(month);
    };

    const toggleEditMode = () => {
        if (!isEditMode) {
            // Entering edit mode: pre-select currently registered pioneers
            setSelectedIds(precursores.map(p => p.id_publicador));
            setShowForm(false);
        }
        setIsEditMode(!isEditMode);
    };

    const toggleSelectPublicador = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(idx => idx !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkSave = async () => {
        setLoading(true);
        try {
            const currentPAs = await getPrecursoresAuxiliaresByMonth(month + '-01');
            const currentIds = currentPAs.map(p => p.id_publicador);

            // Add new ones
            for (const id of selectedIds) {
                if (!currentIds.includes(id)) {
                    await savePrecursorAuxiliar({
                        id_publicador: id,
                        mes: month + '-01'
                    });
                }
            }

            // Remove unselected
            for (const pa of currentPAs) {
                if (!selectedIds.includes(pa.id_publicador)) {
                    await deletePrecursorAuxiliar(pa.id);
                }
            }

            Alert.alert('✅ Éxito local', 'Lista de precursores actualizada localmente.');
            setIsEditMode(false);
            loadPrecursores(month);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo actualizar la lista local.');
        } finally {
            setLoading(false);
        }
    };

    const handlePushChanges = async () => {
        setLoading(true);
        const res = await pushEntityChanges(PrecursorAuxiliar, '/precursoresAuxiliares');
        if (res.success) {
            Alert.alert('Sincronización Exitosa', `Se subieron ${res.count} registros al servidor.`);
            loadPrecursores(month);
        } else {
            Alert.alert('Error de Sincronización', res.error || 'No se pudieron subir los cambios.');
        }
        setLoading(false);
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

            const success = await savePrecursorAuxiliar(payload);
            if (success) {
                Alert.alert('✅ Éxito local', 'Precursor auxiliar registrado localmente.');
                setShowForm(false);
                setSelectedPublicadorId('');
                setNotas('');
                loadPrecursores(month);
            } else {
                Alert.alert('Error', 'Error al guardar localmente.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo guardar el registro local.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Confirmar',
            '¿Eliminar este registro local?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const success = await deletePrecursorAuxiliar(id);
                            if (success) {
                                loadPrecursores(month);
                            } else {
                                Alert.alert('Error', 'No se pudo eliminar de la base local.');
                            }
                        } catch (e) {
                            console.error(e);
                            Alert.alert('Error', 'Error al eliminar.');
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!isEditMode ? (
                        <>
                            <TouchableOpacity onPress={handlePushChanges}><Send size={22} color={colors.textSecondary} /></TouchableOpacity>
                            <TouchableOpacity onPress={handleSync}><RefreshCcw size={22} color={colors.textSecondary} /></TouchableOpacity>
                            <TouchableOpacity onPress={toggleEditMode}><Edit size={22} color={colors.textSecondary} /></TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowForm(!showForm)}>
                                <Plus size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={toggleEditMode}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
                    )}
                </View>
            </View>

            {isEditMode ? (
                <View style={{ flex: 1, padding: 16 }}>
                    <View style={[st.filterCard, { marginBottom: 10 }]}>
                        <Text style={[st.monthLabel, { textAlign: 'center' }]}>Editando: {dayjs(month + '-01').format('MMMM YYYY')}</Text>
                        <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                            Selecciona los publicadores que serán precursores auxiliares este mes.
                        </Text>
                    </View>

                    <FlatList
                        data={publicadores}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <TouchableOpacity
                                    style={[st.itemCard, isSelected && { borderColor: colors.primary, borderWidth: 1 }]}
                                    onPress={() => toggleSelectPublicador(item.id)}
                                >
                                    <View style={st.itemInfo}>
                                        <Text style={st.itemName}>{item.apellidos}, {item.nombre}</Text>
                                        <Text style={st.itemGroup}>Grupo {item.grupo}</Text>
                                    </View>
                                    {isSelected ? <CheckSquare size={24} color={colors.primary} /> : <Square size={24} color={colors.textSecondary} />}
                                </TouchableOpacity>
                            );
                        }}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />

                    <View style={st.editActions}>
                        <TouchableOpacity style={[st.btn, st.btnSecondary, { flex: 1 }]} onPress={toggleEditMode}>
                            <Text style={st.btnTextDark}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[st.btn, st.btnPrimary, { flex: 2 }, loading && st.disabled]} onPress={handleBulkSave} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Save size={20} color="#fff" />
                                    <Text style={st.btnText}>Guardar Cambios</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
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
                                        <Text style={st.itemName}>{p.apellidos}, {p.nombre}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Text style={st.itemGroup}>Grupo {p.grupo}</Text>
                                            {p.notas ? <Text style={st.itemNotes}> • {p.notas}</Text> : null}
                                            {!!p.is_dirty && <View style={st.dirtyDot} />}
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
            )}
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
    dirtyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginLeft: 8 },
    deleteBtn: { padding: 8, backgroundColor: colors.isDarkMode ? '#451a1a' : '#fee2e2', borderRadius: 8 },
    editActions: {
        position: 'absolute', bottom: 20, left: 16, right: 16,
        flexDirection: 'row', gap: 12, backgroundColor: colors.background, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: colors.border
    }
});

export default PrecursoresAuxiliaresScreen;
