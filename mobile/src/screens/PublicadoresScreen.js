import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, TextInput, Modal, ScrollView, Alert, Switch, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Spanish
import { ArrowLeft, User, Search, X, Share2, Edit2, Trash2, RefreshCcw } from 'lucide-react-native';
import { getAllPublicadores } from '../services/repositories/PublicadorRepo';
import { syncAllData } from '../services/SyncService';
import ViewShot from 'react-native-view-shot';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import FileService from '../services/FileService';

dayjs.locale('es');
// ─── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (d) => {
    if (!d) return 'N/A';
    return dayjs(d).format('DD [de] MMMM [de] YYYY');
};
const getType = (id) => ({ 1: 'Publicador', 2: 'Precursor Regular', 3: 'Precursor Auxiliar' }[id] || '');
const getPrivilege = (id) => ({ 1: 'Anciano', 2: 'Siervo Ministerial' }[id] || null);
const getBadges = (p) => ['ungido', 'sordo', 'ciego', 'encarcelado'].filter(k => !!p[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1));

const EMPTY_FORM = {
    nombre: '', apellidos: '', fecha_nacimiento: '', fecha_bautismo: '',
    grupo: '', sup_grupo: '', sexo: 'H', id_tipo_publicador: '1', id_privilegio: '',
    ungido: false, sordo: false, ciego: false, encarcelado: false,
    calle: '', num: '', colonia: '', telefono_fijo: '', telefono_movil: '',
    contacto_emergencia: '', tel_contacto_emergencia: '', correo_contacto_emergencia: ''
};

// ─── Small helper components ─────────────────────────────────────────────────

// A labelled text input for the edit form
const Field = ({ label, value, onChangeText, keyboardType, placeholder }) => {
    const { colors } = useTheme();
    const st = getFormStyles(colors);
    return (
        <View style={st.fieldGroup}>
            <Text style={st.fieldLabel}>{label}</Text>
            <TextInput
                style={st.fieldInput}
                value={String(value ?? '')}
                onChangeText={onChangeText}
                keyboardType={keyboardType || 'default'}
                placeholder={placeholder || ''}
                placeholderTextColor={colors.textSecondary}
            />
        </View>
    );
};

// A radio-style single select row
const SelectRow = ({ label, options, value, onChange }) => {
    const { colors } = useTheme();
    const st = getFormStyles(colors);
    return (
        <View style={st.fieldGroup}>
            <Text style={st.fieldLabel}>{label}</Text>
            <View style={st.selectRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[st.selectOption, value === opt.value && st.selectOptionActive]}
                        onPress={() => onChange(opt.value)}
                    >
                        <Text style={[st.selectOptionText, value === opt.value && st.selectOptionTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// A toggle row
const Toggle = ({ label, value, onToggle }) => {
    const { colors } = useTheme();
    const st = getFormStyles(colors);
    return (
        <View style={st.toggleRow}>
            <Text style={st.fieldLabel}>{label}</Text>
            <Switch value={!!value} onValueChange={onToggle} trackColor={{ true: colors.primary }} />
        </View>
    );
};

// ─── Publisher Card ──────────────────────────────────────────────────────────
const PublicadorCardView = ({ p }) => {
    const { colors } = useTheme();
    const st = getCardStyles(colors);
    const [configuraciones, setConfiguraciones] = useState([]);
    useEffect(() => {
        const fetchConfiguraciones = async () => {
            const response = await api.get('/configuraciones');
            const data = await response.data;
            setConfiguraciones(data.data);
        };
        fetchConfiguraciones();
    }, []);

    const getCongregacion = () => {
        const configuracion = configuraciones.find(c => c.clave === 'nombre_congregacion');
        return configuracion?.valor || '';
    };
    return (
        <View style={st.card}>
            <View style={st.header}>
                <Text style={st.name}>{p.nombre} {p.apellidos}</Text>
                {getType(p.id_tipo_publicador) ? (
                    <View style={st.typeBadge}><Text style={st.typeBadgeText}>{getType(p.id_tipo_publicador)}</Text></View>
                ) : null}
            </View>
            <View style={st.body}>
                {getPrivilege(p.id_privilegio) ? (
                    <View style={st.row}><Text style={st.rowLabel}>Privilegio:</Text><Text style={st.rowValue}>{getPrivilege(p.id_privilegio)}</Text></View>
                ) : null}
                <View style={st.row}>
                    <Text style={st.rowLabel}>Grupo:</Text>
                    <Text style={st.rowValue}>{p.grupo}{p.sup_grupo === 1 ? ' (Sup)' : p.sup_grupo === 2 ? ' (Aux)' : ''}</Text>
                </View>
                <View style={st.row}>
                    <Text style={st.rowLabel}>Estatus:</Text>
                    <Text style={[st.rowValue, { color: p.Estatus === 'Activo' ? colors.success : colors.danger }]}>{p.Estatus || 'N/A'}</Text>
                </View>
                <View style={st.row}><Text style={st.rowLabel}>Tel. Móvil:</Text><Text style={st.rowValue}>{p.telefono_movil || 'N/A'}</Text></View>
                <View style={st.row}><Text style={st.rowLabel}>Tel. Fijo:</Text><Text style={st.rowValue}>{p.telefono_fijo || 'N/A'}</Text></View>
                {p.fecha_nacimiento ? (
                    <View style={st.row}><Text style={st.rowLabel}>Nacimiento:</Text><Text style={st.rowValue}>{formatDate(p.fecha_nacimiento)}</Text></View>
                ) : null}
                {p.fecha_bautismo ? (
                    <View style={st.row}><Text style={st.rowLabel}>Bautismo:</Text><Text style={st.rowValue}>{formatDate(p.fecha_bautismo)}</Text></View>
                ) : null}
                {(p.calle || p.colonia) ? (
                    <View style={st.section}>
                        <Text style={st.sectionLabel}>Dirección:</Text>
                        <Text style={st.sectionValue}>{p.calle}{p.num ? ` #${p.num}` : ''}{p.colonia ? `\n${p.colonia}` : ''}</Text>
                    </View>
                ) : null}
                {(p.contacto_emergencia || p.tel_contacto_emergencia) ? (
                    <View style={[st.section, { borderTopColor: '#fca5a5' }]}>
                        <Text style={[st.sectionLabel, { color: '#b91c1c' }]}>🚑 Emergencia:</Text>
                        {p.contacto_emergencia ? <Text style={st.sectionValue}>{p.contacto_emergencia}</Text> : null}
                        {p.tel_contacto_emergencia ? <Text style={st.sectionValue}>📞 {p.tel_contacto_emergencia}</Text> : null}
                    </View>
                ) : null}
                {getBadges(p).length > 0 ? (
                    <View style={st.badgeRow}>
                        {getBadges(p).map(b => (
                            <View key={b} style={st.badge}><Text style={st.badgeText}>{b}</Text></View>
                        ))}
                    </View>
                ) : null}
                <Text style={st.footer}>Congregación {getCongregacion()}</Text>
            </View>
        </View>
    );
};
// ─── DatePickerField helper ──────────────────────────────────────────────────
// Converts a YYYY-MM-DD string ↔ Date object for the native picker
const strToDate = (s) => {
    if (!s) return new Date();
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};
const dateToStr = (d) => d.toISOString().split('T')[0];

const DatePickerField = ({ label, value, onChange }) => {
    const { colors } = useTheme();
    const st = getFormStyles(colors);
    const [show, setShow] = useState(false);
    const handleChange = (event, selected) => {
        const current = selected || strToDate(value);
        setShow(Platform.OS === 'ios');
        onChange(dateToStr(current));
    };
    return (
        <View style={st.fieldGroup}>
            <Text style={st.fieldLabel}>{label}</Text>
            <TouchableOpacity style={st.fieldInput} onPress={() => setShow(true)}>
                <Text style={{ color: value ? colors.text : colors.textSecondary, fontSize: 15 }}>
                    {value || 'Sin fecha'}
                </Text>
            </TouchableOpacity>
            {show && (
                <DateTimePicker
                    value={strToDate(value)}
                    mode="date"
                    display="default"
                    onChange={handleChange}
                />
            )}
        </View>
    );
};

// ─── Edit Form Modal ─────────────────────────────────────────────────────────
const EditModal = ({ publicador, onClose, onSaved }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const fs = getFormStyles(colors);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (publicador) {
            setForm({
                ...EMPTY_FORM,
                ...publicador,
                id_tipo_publicador: String(publicador.id_tipo_publicador ?? '1'),
                id_privilegio: String(publicador.id_privilegio ?? ''),
                sup_grupo: String(publicador.sup_grupo ?? ''),
                ungido: !!publicador.ungido,
                sordo: !!publicador.sordo,
                ciego: !!publicador.ciego,
                encarcelado: !!publicador.encarcelado,
            });
        }
    }, [publicador]);

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSave = async () => {
        if (!form.nombre.trim() || !form.apellidos.trim()) {
            Alert.alert('Aviso', 'Nombre y apellidos son requeridos.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                id_tipo_publicador: parseInt(form.id_tipo_publicador) || null,
                id_privilegio: form.id_privilegio ? parseInt(form.id_privilegio) : null,
                sup_grupo: form.sup_grupo ? parseInt(form.sup_grupo) : null,
                ungido: form.ungido ? 1 : 0,
                sordo: form.sordo ? 1 : 0,
                ciego: form.ciego ? 1 : 0,
                encarcelado: form.encarcelado ? 1 : 0,
            };
            const resp = await api.put(`/publicador/${publicador.id}`, payload);
            if (resp.data.success) {
                onSaved();
            } else {
                Alert.alert('Error', resp.data.error || 'No se pudo guardar.');
            }
        } catch (e) {
            Alert.alert('Error', 'Error al conectar con el servidor.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={!!publicador} animationType="slide" transparent onRequestClose={onClose}>
            <View style={st.modalOverlay}>
                <View style={[st.modalContainer, { maxHeight: '95%' }]}>
                    <View style={st.modalHeader}>
                        <Text style={st.modalTitle}>Editar Publicador</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                        <View style={{ padding: 4 }}>
                            <Field label="Nombre *" value={form.nombre} onChangeText={v => set('nombre', v)} />
                            <Field label="Apellidos *" value={form.apellidos} onChangeText={v => set('apellidos', v)} />
                            <Field label="Grupo" value={form.grupo} onChangeText={v => set('grupo', v)} keyboardType="numeric" />
                            <DatePickerField label="Fecha de Nacimiento" value={form.fecha_nacimiento} onChange={v => set('fecha_nacimiento', v)} />
                            <DatePickerField label="Fecha de Bautismo" value={form.fecha_bautismo} onChange={v => set('fecha_bautismo', v)} />

                            <SelectRow
                                label="Sexo"
                                options={[{ value: 'H', label: 'Masculino' }, { value: 'M', label: 'Femenino' }]}
                                value={form.sexo}
                                onChange={v => set('sexo', v)}
                            />
                            <SelectRow
                                label="Tipo Publicador"
                                options={[{ value: '1', label: 'Publicador' }, { value: '2', label: 'Prec. Regular' }, { value: '3', label: 'Prec. Auxiliar' }]}
                                value={form.id_tipo_publicador}
                                onChange={v => set('id_tipo_publicador', v)}
                            />
                            <SelectRow
                                label="Privilegio"
                                options={[{ value: '', label: 'Ninguno' }, { value: '1', label: 'Anciano' }, { value: '2', label: 'Siervo' }]}
                                value={form.id_privilegio}
                                onChange={v => set('id_privilegio', v)}
                            />
                            <SelectRow
                                label="Sup Grupo"
                                options={[{ value: '', label: 'Ninguno' }, { value: '1', label: 'Sup' }, { value: '2', label: 'Aux' }]}
                                value={form.sup_grupo}
                                onChange={v => set('sup_grupo', v)}
                            />

                            <View style={fs.toggleGrid}>
                                <Toggle label="Ungido" value={form.ungido} onToggle={v => set('ungido', v)} />
                                <Toggle label="Sordo" value={form.sordo} onToggle={v => set('sordo', v)} />
                                <Toggle label="Ciego" value={form.ciego} onToggle={v => set('ciego', v)} />
                                <Toggle label="Encarcelado" value={form.encarcelado} onToggle={v => set('encarcelado', v)} />
                            </View>

                            <Text style={fs.sectionTitle}>Dirección</Text>
                            <Field label="Calle" value={form.calle} onChangeText={v => set('calle', v)} />
                            <Field label="Número" value={form.num} onChangeText={v => set('num', v)} />
                            <Field label="Colonia" value={form.colonia} onChangeText={v => set('colonia', v)} />

                            <Text style={fs.sectionTitle}>Teléfonos</Text>
                            <Field label="Tel. Fijo" value={form.telefono_fijo} onChangeText={v => set('telefono_fijo', v)} keyboardType="phone-pad" />
                            <Field label="Tel. Móvil" value={form.telefono_movil} onChangeText={v => set('telefono_movil', v)} keyboardType="phone-pad" />

                            <Text style={fs.sectionTitle}>Emergencia</Text>
                            <Field label="Contacto" value={form.contacto_emergencia} onChangeText={v => set('contacto_emergencia', v)} />
                            <Field label="Tel. Emergencia" value={form.tel_contacto_emergencia} onChangeText={v => set('tel_contacto_emergencia', v)} keyboardType="phone-pad" />
                            <Field label="Correo Emergencia" value={form.correo_contacto_emergencia} onChangeText={v => set('correo_contacto_emergencia', v)} keyboardType="email-address" />
                        </View>
                    </ScrollView>
                    <View style={st.modalFooter}>
                        <TouchableOpacity style={st.modalSecondaryBtn} onPress={onClose}>
                            <Text style={st.modalSecondaryBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[st.modalPrimaryBtn, saving && st.disabledBtn]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={st.modalPrimaryBtnText}>Guardar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const PublicadoresScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [publicadores, setPublicadores] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);   // card modal
    const [editing, setEditing] = useState(null);     // edit modal
    const [selectedGroup, setSelectedGroup] = useState('Todos');
    const [groups, setGroups] = useState([]);
    const [sharing, setSharing] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => { fetchPublicadores(); }, []);

    useEffect(() => {
        let res = publicadores;
        if (search.trim()) {
            const t = search.toLowerCase();
            res = res.filter(p => `${p.apellidos}, ${p.nombre}`.toLowerCase().includes(t));
        }
        if (selectedGroup !== 'Todos') {
            res = res.filter(p => p.grupo == selectedGroup);
        }
        setFiltered(res);
    }, [search, selectedGroup, publicadores]);

    const fetchPublicadores = async () => {
        try {
            setLoading(true);
            const data = await getAllPublicadores();
            const sorted = data.sort((a, b) => `${a.Estatus} ${a.apellidos}, ${a.nombre}`.localeCompare(`${b.Estatus} ${b.apellidos}, ${b.nombre}`));
            setPublicadores(sorted);
            const uniqueGroups = [...new Set(sorted.map(p => p.grupo).filter(g => g))].sort((a, b) => a - b);
            setGroups(['Todos', ...uniqueGroups]);
            setFiltered(sorted);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los publicadores locales.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        fetchPublicadores();
    };

    const handleDelete = (p) => {
        Alert.alert(
            'Eliminar Publicador',
            `¿Estás seguro de que deseas eliminar a ${p.nombre} ${p.apellidos}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar', style: 'destructive', onPress: async () => {
                        try {
                            const resp = await api.delete(`/publicador/${p.id}`);
                            if (resp.data.success) {
                                setSelected(null);
                                fetchPublicadores();
                            } else {
                                Alert.alert('Error', resp.data.error || 'No se pudo eliminar.');
                            }
                        } catch {
                            Alert.alert('Error', 'Error al conectar con el servidor.');
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setSharing(true);
        try {
            const uri = await cardRef.current.capture();
            const filename = `Tarjeta_${selected.nombre}_${selected.apellidos}.png`;
            await FileService.saveAndShareFile(uri, filename);
        } catch {
            Alert.alert('Error', 'No se pudo compartir la tarjeta.');
        } finally {
            setSharing(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={st.card} onPress={() => setSelected(item)}>
            <View style={st.cardLeft}><User size={22} color={colors.textSecondary} /></View>
            <View style={st.cardInfo}>
                <Text style={st.name}>{item.apellidos}, {item.nombre}</Text>
                <Text style={st.sub}>Grupo {item.grupo || '—'}{item.privilegio ? `  ·  ${item.privilegio}` : ''}</Text>
            </View>
            <View style={[st.statusBadge, item.Estatus === 'Activo' ? st.statusActive : st.statusInactive]}>
                <Text style={[st.statusText, item.Estatus === 'Activo' ? st.statusTextActive : st.statusTextInactive]}>
                    {item.Estatus || 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={st.container}>
            {/* Top bar */}
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Publicadores</Text>
                <TouchableOpacity onPress={handleSync} style={{ padding: 8 }}>
                    <RefreshCcw size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={st.searchWrapper}>
                <Search size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={st.searchInput}
                    placeholder="Buscar publicador..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={colors.textSecondary}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}><X size={18} color={colors.textSecondary} /></TouchableOpacity>
                )}
            </View>

            {/* Group Filter */}
            <View style={{ height: 50, marginTop: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
                    {groups.map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[st.groupBtn, selectedGroup === g && st.groupBtnActive]}
                            onPress={() => setSelectedGroup(g)}
                        >
                            <Text style={[st.groupBtnText, selectedGroup === g && st.groupBtnTextActive]}>
                                {g === 'Todos' ? 'Todos' : `Grupo ${g}`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {filtered.length > 0 && (
                <View style={st.summaryContainer}>
                    <View style={st.totalRow}>
                        <Text style={st.totalLabel}>Publicadores (total): </Text>
                        <Text style={st.totalValue}>{filtered.length}</Text>
                    </View>
                    <View style={st.totalRow}>
                        <Text style={st.totalLabel}>Precursores regulares:</Text>
                        <Text style={st.totalValue}>{filtered.reduce((acc, item) => acc + (item.id_tipo_publicador === 2 ? 1 : 0), 0)}</Text>
                    </View>
                    <View style={st.totalRow}>
                        <Text style={st.totalLabel}>Activos:</Text>
                        <Text style={st.totalValue}>{filtered.reduce((acc, item) => acc + (item.Estatus === 'Activo' ? 1 : 0), 0)}</Text>
                    </View>
                    <View style={st.totalRow}>
                        <Text style={st.totalLabel}>Inactivos:</Text>
                        <Text style={st.totalValue}>{filtered.reduce((acc, item) => acc + (item.Estatus === 'Inactivo' ? 1 : 0), 0)}</Text>
                    </View>
                </View>
            )}

            {loading
                ? <View style={st.center}><ActivityIndicator size="large" color={colors.primary} /></View>
                : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        ListEmptyComponent={
                            <View style={st.center}>
                                <Text style={{ color: colors.textSecondary }}>No se encontraron publicadores</Text>
                            </View>
                        }
                    />
                )
            }

            {/* ── Card View Modal ── */}
            <Modal
                visible={!!selected}
                animationType="slide"
                transparent
                onRequestClose={() => setSelected(null)}
            >
                <View style={st.modalOverlay}>
                    <View style={st.modalContainer}>
                        <View style={st.modalHeader}>
                            <Text style={st.modalTitle}>Tarjeta de Publicador</Text>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                            {selected && (
                                <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
                                    <PublicadorCardView p={selected} />
                                </ViewShot>
                            )}
                        </ScrollView>

                        {/* Actions: Share | Edit | Delete */}
                        <View style={[st.modalFooter, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[st.iconBtn, st.dangerBtn]}
                                    onPress={() => handleDelete(selected)}
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[st.iconBtn]}
                                    onPress={() => { setEditing(selected); setSelected(null); }}
                                >
                                    <Edit2 size={18} color={colors.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[st.iconBtn, st.modalPrimaryBtn, sharing && st.disabledBtn]}
                                    onPress={handleShare}
                                    disabled={sharing}
                                >
                                    {sharing
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : (
                                            <>
                                                <Share2 size={16} color="#fff" />
                                                <Text style={st.modalPrimaryBtnText} />
                                            </>
                                        )
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Edit Modal ── */}
            <EditModal
                publicador={editing}
                onClose={() => setEditing(null)}
                onSaved={() => { setEditing(null); fetchPublicadores(); Alert.alert('¡Listo!', 'Publicador actualizado correctamente.'); }}
            />
        </View>
    );
};

// ─── Styles Creators ──────────────────────────────────────────────────────────
const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
    searchWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
        margin: 16, marginBottom: 0, paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    summaryContainer: {
        marginTop: 8,
        marginBottom: 8,
        padding: 12,
        backgroundColor: colors.card,
        borderRadius: 12,
        marginHorizontal: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    totalLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.primary,
    },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
        borderRadius: 12, padding: 14,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 2,
    },
    cardLeft: { marginRight: 12 },
    cardInfo: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusActive: { backgroundColor: colors.isDarkMode ? '#064e3b' : '#d1fae5' },
    statusInactive: { backgroundColor: colors.isDarkMode ? '#7f1d1d' : '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextActive: { color: colors.isDarkMode ? '#d1fae5' : '#065f46' },
    statusTextInactive: { color: colors.isDarkMode ? '#fee2e2' : '#991b1b' },

    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: '90%', paddingHorizontal: 16, paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    modalFooter: {
        flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
    },
    modalSecondaryBtn: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: colors.border,
    },
    modalSecondaryBtnText: { color: colors.text, fontWeight: '600' },
    modalPrimaryBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    },
    modalPrimaryBtnText: { color: '#fff', fontWeight: '600' },
    disabledBtn: { backgroundColor: colors.textSecondary },
    iconBtn: {
        width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
        justifyContent: 'center', alignItems: 'center', backgroundColor: colors.inputBackground,
    },
    dangerBtn: { borderColor: '#fecaca', backgroundColor: colors.isDarkMode ? '#451a1a' : '#fff1f2' },
    groupBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, height: 36, justifyContent: 'center' },
    groupBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    groupBtnText: { color: colors.text, fontSize: 13, fontWeight: '600' },
    groupBtnTextActive: { color: '#fff' },
});

const getCardStyles = (colors) => StyleSheet.create({
    card: { margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.isDarkMode ? '#1e293b' : '#f0f4ff' },
    header: { backgroundColor: colors.isDarkMode ? '#0f172a' : '#1e3a5f', padding: 20 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    typeBadge: {
        marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    },
    typeBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    body: { padding: 20, gap: 10 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8,
    },
    rowLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    rowValue: { fontSize: 14, color: '#000000', fontWeight: '700' },
    section: { marginTop: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563', marginBottom: 4 },
    sectionValue: { fontSize: 14, color: colors.textSecondary },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    badge: {
        backgroundColor: colors.isDarkMode ? '#312e81' : '#e0e7ff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: colors.isDarkMode ? '#4338ca' : '#c7d2fe',
    },
    badgeText: { fontSize: 12, color: colors.isDarkMode ? '#e0e7ff' : '#3730a3', fontWeight: '600' },
    footer: { marginTop: 12, fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
});

const getFormStyles = (colors) => StyleSheet.create({
    fieldGroup: { marginBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
    fieldInput: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10,
        fontSize: 15, backgroundColor: colors.inputBackground, color: colors.inputText,
    },
    selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectOption: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground,
    },
    selectOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    selectOptionText: { fontSize: 14, color: colors.text, fontWeight: '500' },
    selectOptionTextActive: { color: '#fff' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    toggleGrid: { flexWrap: 'wrap', marginBottom: 12 },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: colors.primary,
        marginTop: 8, marginBottom: 10, paddingBottom: 6,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
});

export default PublicadoresScreen;
