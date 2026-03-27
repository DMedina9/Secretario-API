import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, Switch, Linking
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, MessageCircle, RefreshCcw } from 'lucide-react-native';
import { getAllPublicadores } from '../services/repositories/PublicadorRepo';
import { getInformesByPublicadorAndAnio, getPrecursoresAuxiliaresByMonth, saveInforme } from '../services/repositories/InformeRepo';
import { syncAllData, pushEntityChanges } from '../services/SyncService';
import { Informe } from '../services/models';
import { Send } from 'lucide-react-native';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

dayjs.locale('es');

// ─── Informe Row ──────────────────────────────────────────────────────────────
const InformeRow = ({ item, index, data, onChange, month }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const isRP = item.id_tipo_publicador === 2;
    const prevIsRP = index > 0 && data[index - 1].id_tipo_publicador === 2;
    const showRPHeader = index === 0 && isRP;
    const showPubHeader = (index === 0 && !isRP) || (index > 0 && !isRP && prevIsRP);
    //console.log(item);
    return (
        <>
            {showRPHeader && <Text style={st.groupHeader}>⭐ Precursores Regulares</Text>}
            {showPubHeader && <Text style={st.groupHeader}>👥 Publicadores</Text>}
            <View style={st.informeCard}>
                <View style={st.informeTop}>
                    {item.telefono ? <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${item.telefono}`)}><Text style={st.informeName}>{item.nombre}</Text></TouchableOpacity>
                        : <Text style={st.informeName}>{item.nombre}</Text>}
                    {!item.predico_en_el_mes && item.telefono ? (
                        <TouchableOpacity style={st.waBadge} onPress={() => Linking.openURL(`https://wa.me/${item.telefono}?text=Hola%20${item.sexo === 'H' ? 'hermano' : 'hermana'}%2C%20buen%20d%C3%ADa!%20Me%20puede%20mandar%20su%20informe%20de%20${dayjs(month + '-01').format('MMMM YYYY')}%2C%20por%20favor%3F%20Saludos!`)}>
                            <MessageCircle size={12} color="#25d366" />
                            <Text style={st.waText}>{item.telefono}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
                <View style={[st.statusBadge, item.Estatus === 'Activo' ? st.statusActive : st.statusInactive]}>
                    <Text style={[st.statusText, item.Estatus === 'Activo' ? st.statusTextActive : st.statusTextInactive]}>{item.Estatus}</Text>
                </View>
                <View style={st.informeRow}>
                    <Text style={st.rowLabel}>Predicó</Text>
                    <Switch
                        value={!!item.predico_en_el_mes}
                        onValueChange={v => onChange(index, 'predico_en_el_mes', v ? 1 : 0)}
                        trackColor={{ true: colors.primary }}
                    />
                </View>
                {!!item.predico_en_el_mes && (
                    <>
                        <View style={st.informeRow}>
                            <Text style={st.rowLabel}>Cursos Bíblicos</Text>
                            <TextInput
                                style={st.numInput}
                                keyboardType="numeric"
                                value={item.cursos_biblicos?.toString() ?? ''}
                                onChangeText={v => onChange(index, 'cursos_biblicos', parseInt(v) || 0)}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        {item.id_base_tipo !== 2 && (
                            <View style={st.informeRow}>
                                <Text style={st.rowLabel}>Precursor Aux.</Text>
                                <Switch
                                    value={item.id_tipo_publicador === 3}
                                    onValueChange={v => onChange(index, 'id_tipo_publicador', v ? 3 : 1)}
                                    trackColor={{ true: colors.primary }}
                                />
                            </View>
                        )}
                        {item.id_tipo_publicador !== 1 && (
                            <>
                                <View style={st.informeRow}>
                                    <Text style={st.rowLabel}>Horas</Text>
                                    <TextInput
                                        style={st.numInput}
                                        keyboardType="numeric"
                                        value={item.horas?.toString() ?? ''}
                                        onChangeText={v => onChange(index, 'horas', parseInt(v) || 0)}
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                                {isRP && <View style={st.informeRow}>
                                    <Text style={st.rowLabel}>Horas S.S.</Text>
                                    <TextInput
                                        style={st.numInput}
                                        keyboardType="numeric"
                                        value={item.horas_SS?.toString() ?? ''}
                                        onChangeText={v => {
                                            const val = parseInt(v) || 0;
                                            const horas = item.horas || 0;
                                            const horas_acreditadas = Math.max(0, Math.min(55 - horas, val));
                                            let notas = item.notas || '';
                                            notas = `S.S. ${val} hrs. Acreditadas: ${horas_acreditadas} hrs.`;
                                            onChange(index, 'horas_SS', val)
                                            onChange(index, 'notas', notas)
                                        }}
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>}
                            </>
                        )}
                        <View style={st.informeRow}>
                            <Text style={st.rowLabel}>Notas</Text>
                            <TextInput
                                style={[st.numInput, { width: 'auto', minWidth: 140, maxWidth: 300, fontSize: 13 }]}
                                value={item.notas ?? ''}
                                onChangeText={v => onChange(index, 'notas', v)}
                                placeholderTextColor={colors.textSecondary}
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
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [month, setMonth] = useState(dayjs().subtract(1, 'month').format('YYYY-MM'));
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [bulkData, setBulkData] = useState([]);
    const [loading, setLoading] = useState(false);

    const mes_envio = dayjs().subtract(1, 'month').format('YYYY-MM');
    useEffect(() => { loadGroups(); }, []);

    const loadGroups = async () => {
        try {
            const pubs = await getAllPublicadores();
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
            const allPubs = await getAllPublicadores();
            const publicadores = allPubs.filter(p => p.grupo == selectedGroup);
            
            if (!publicadores.length) { 
                Alert.alert('Aviso', 'No hay publicadores en este grupo.'); 
                setBulkData([]); 
                return; 
            }

            const monthDate = dayjs(month + '-01');
            let serviceYear = monthDate.year();
            if (monthDate.month() >= 8) serviceYear++;
            const monthStr = month.substring(5, 7);

            const sorted = publicadores.sort((a, b) => {
                const va = a.id_tipo_publicador % 2, vb = b.id_tipo_publicador % 2;
                if (va !== vb) return va - vb;
                return `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`);
            });

            // Fetch auxiliares and existing informes locally
            const aux = await getPrecursoresAuxiliaresByMonth(serviceYear, monthStr);
            
            const results = await Promise.all(sorted.map(async pub => {
                const informes = await getInformesByPublicadorAndAnio(pub.id, serviceYear);
                const ex = informes.find(i => i.mes.startsWith(month));
                const isAux = aux.some(a => a.id_publicador === pub.id);
                
                return {
                    id_publicador: pub.id,
                    nombre: `${pub.apellidos}, ${pub.nombre}`,
                    sexo: pub.sexo,
                    telefono: pub.telefono_movil,
                    mes: month + '-01',
                    mes_envio: mes_envio + '-01',
                    predico_en_el_mes: ex ? ex.predico_en_el_mes : 0,
                    horas: ex ? ex.horas : 0,
                    horas_SS: ex ? ex.horas_SS : 0,
                    cursos_biblicos: ex ? ex.cursos_biblicos : 0,
                    id_base_tipo: pub.id_tipo_publicador,
                    id_tipo_publicador: ex ? ex.id_tipo_publicador : (isAux ? 3 : (pub.id_tipo_publicador || 1)),
                    notas: ex ? ex.notas : '',
                    Estatus: pub.Estatus // Read from the pre-calculated field in SQLite
                };
            }));

            setBulkData(results);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Error al cargar datos locales.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        loadGroups();
        if (bulkData.length) loadBulkData();
        else setLoading(false);
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
            for (const item of bulkData) {
                const payload = {
                    id_publicador: item.id_publicador,
                    mes: item.mes,
                    predico_en_el_mes: item.predico_en_el_mes ? 1 : 0,
                    horas: parseInt(item.horas) || 0,
                    horas_SS: parseInt(item.horas_SS) || 0,
                    cursos_biblicos: parseInt(item.cursos_biblicos) || 0,
                    id_tipo_publicador: parseInt(item.id_tipo_publicador),
                    notas: item.notas
                };
                
                // Find if exists to get the ID for update, or just save
                const informes = await getInformesByPublicadorAndAnio(item.id_publicador, dayjs(item.mes).year() + (dayjs(item.mes).month() >= 8 ? 1 : 0));
                const ex = informes.find(i => i.mes.startsWith(item.mes.substring(0, 7)));
                
                await saveInforme({ ...payload, id: ex ? ex.id : null });
            }
            Alert.alert('✅ Guardado Local', `${bulkData.length} informes guardados localmente.`);
            setBulkData([]);
            loadBulkData();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Error al guardar informes localmente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePushChanges = async () => {
        setLoading(true);
        const res = await pushEntityChanges(Informe, '/informe');
        if (res.success) {
            Alert.alert('Sincronización Exitosa', `Se subieron ${res.count} informes al servidor.`);
            loadBulkData();
        } else {
            Alert.alert('Error de Sincronización', res.error || 'No se pudieron subir los informes.');
        }
        setLoading(false);
    };

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#FFFFFF" /></TouchableOpacity>
                <Text style={st.headerTitle}>Informes de Predicación</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={handlePushChanges}><Send size={24} color="#FFFFFF" /></TouchableOpacity>
                    <TouchableOpacity onPress={handleSync}><RefreshCcw size={24} color="#FFFFFF" /></TouchableOpacity>
                    {bulkData.length > 0 ? (
                        <TouchableOpacity onPress={handleSave}><Save size={24} color={colors.primary} /></TouchableOpacity>
                    ) : null}
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Filters */}
                <View style={st.filterCard}>
                    <View style={st.monthNavRow}>
                        <TouchableOpacity onPress={() => setMonth(m => dayjs(m + '-01').subtract(1, 'month').format('YYYY-MM'))}>
                            <ChevronLeft size={26} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={st.monthLabel}>{dayjs(month + '-01').format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => setMonth(m => dayjs(m + '-01').add(1, 'month').format('YYYY-MM'))}>
                            <ChevronRight size={26} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={st.filterLabel}>Grupo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {groups.map(g => (
                            <TouchableOpacity
                                key={g}
                                style={[st.groupChip, selectedGroup === g && st.groupChipActive]}
                                onPress={() => setSelectedGroup(g)}
                            >
                                <Text style={[st.groupChipText, selectedGroup === g && st.groupChipTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={[st.applyBtn, loading && st.disabled]} onPress={loadBulkData} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.applyBtnText}>Cargar Informes</Text>}
                    </TouchableOpacity>
                </View>

                {bulkData.length > 0 && (
                    <View style={{ marginTop: 8, marginBottom: 8, padding: 12, backgroundColor: colors.card, borderRadius: 12 }}>
                        <View style={st.totalRow}>
                            <Text style={st.totalLabel}>Publicadores (total): </Text>
                            <Text style={st.totalValue}>{bulkData.length}</Text>
                        </View>
                        <View style={st.totalRow}>
                            <Text style={st.totalLabel}>Precursores regulares:</Text>
                            <Text style={st.totalValue}>{bulkData.reduce((acc, item) => acc + (item.id_tipo_publicador === 2 ? 1 : 0), 0)}</Text>
                        </View>
                        <View style={st.totalRow}>
                            <Text style={st.totalLabel}>Informes:</Text>
                            <Text style={st.totalValue}>{bulkData.reduce((acc, item) => acc + (item.predico_en_el_mes ? 1 : 0), 0)}</Text>
                        </View>
                        <View style={st.totalRow}>
                            <Text style={st.totalLabel}>Cursos biblicos:</Text>
                            <Text style={st.totalValue}>{bulkData.reduce((acc, item) => acc + (item.cursos_biblicos), 0)}</Text>
                        </View>
                    </View>
                )}
                {bulkData.map((item, index) => (
                    <InformeRow key={item.id_publicador} item={item} index={index} data={bulkData} onChange={handleFieldChange} month={month} />
                ))}

                {bulkData.length > 0 && (
                    <TouchableOpacity style={[st.applyBtn, { marginTop: 8 }, loading && st.disabled]} onPress={handleSave} disabled={loading}>
                        <Text style={st.applyBtnText}>💾 Guardar Todos ({bulkData.length})</Text>
                    </TouchableOpacity>
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
    statusBadge: { alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusActive: { backgroundColor: colors.isDarkMode ? '#064e3b' : '#d1fae5' },
    statusInactive: { backgroundColor: colors.isDarkMode ? '#7f1d1d' : '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextActive: { color: colors.isDarkMode ? '#d1fae5' : '#065f46' },
    statusTextInactive: { color: colors.isDarkMode ? '#fee2e2' : '#991b1b' },
    filterCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: colors.text, width: 180, textAlign: 'center', textTransform: 'capitalize' },
    filterLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
    groupChip: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, marginRight: 8,
    },
    groupChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    groupChipText: { fontSize: 14, color: colors.text },
    groupChipTextActive: { color: '#fff', fontWeight: '600' },
    applyBtn: { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    disabled: { backgroundColor: colors.textSecondary },
    groupHeader: {
        fontSize: 14, fontWeight: 'bold', color: colors.primary, backgroundColor: colors.isDarkMode ? '#1e293b' : '#eff6ff',
        padding: 10, borderRadius: 8, marginBottom: 4,
    },
    informeCard: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 8, elevation: 1 },
    informeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    informeName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
    waBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    waText: { fontSize: 12, color: '#25d366' },
    informeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    rowLabel: { fontSize: 14, color: colors.textSecondary },
    numInput: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 6,
        width: 80, fontSize: 15, textAlign: 'center', color: colors.inputText, backgroundColor: colors.inputBackground,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    totalValue: { fontSize: 16, color: colors.text, alignSelf: 'flex-end', textAlign: 'right' },
});

export default InformesScreen;
