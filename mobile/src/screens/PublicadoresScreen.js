import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, TextInput, Modal, ScrollView, Alert, Switch, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Spanish
import { ArrowLeft, User, Search, X, Share2, Edit2, Trash2 } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import api from '../services/api';

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
const Field = ({ label, value, onChangeText, keyboardType, placeholder }) => (
    <View style={fs.fieldGroup}>
        <Text style={fs.fieldLabel}>{label}</Text>
        <TextInput
            style={fs.fieldInput}
            value={String(value ?? '')}
            onChangeText={onChangeText}
            keyboardType={keyboardType || 'default'}
            placeholder={placeholder || ''}
            placeholderTextColor="#9ca3af"
        />
    </View>
);

// A radio-style single select row
const SelectRow = ({ label, options, value, onChange }) => (
    <View style={fs.fieldGroup}>
        <Text style={fs.fieldLabel}>{label}</Text>
        <View style={fs.selectRow}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt.value}
                    style={[fs.selectOption, value === opt.value && fs.selectOptionActive]}
                    onPress={() => onChange(opt.value)}
                >
                    <Text style={[fs.selectOptionText, value === opt.value && fs.selectOptionTextActive]}>
                        {opt.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

// A toggle row
const Toggle = ({ label, value, onToggle }) => (
    <View style={fs.toggleRow}>
        <Text style={fs.fieldLabel}>{label}</Text>
        <Switch value={!!value} onValueChange={onToggle} trackColor={{ true: '#3b82f6' }} />
    </View>
);

// ─── Publisher Card ──────────────────────────────────────────────────────────
const PublicadorCardView = ({ p }) => {
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
        <View style={cs.card}>
            <View style={cs.header}>
                <Text style={cs.name}>{p.nombre} {p.apellidos}</Text>
                {getType(p.id_tipo_publicador) ? (
                    <View style={cs.typeBadge}><Text style={cs.typeBadgeText}>{getType(p.id_tipo_publicador)}</Text></View>
                ) : null}
            </View>
            <View style={cs.body}>
                {getPrivilege(p.id_privilegio) ? (
                    <View style={cs.row}><Text style={cs.rowLabel}>Privilegio:</Text><Text style={cs.rowValue}>{getPrivilege(p.id_privilegio)}</Text></View>
                ) : null}
                <View style={cs.row}>
                    <Text style={cs.rowLabel}>Grupo:</Text>
                    <Text style={cs.rowValue}>{p.grupo}{p.sup_grupo === 1 ? ' (Sup)' : p.sup_grupo === 2 ? ' (Aux)' : ''}</Text>
                </View>
                <View style={cs.row}>
                    <Text style={cs.rowLabel}>Estatus:</Text>
                    <Text style={[cs.rowValue, { color: p.Estatus === 'Activo' ? '#065f46' : '#991b1b' }]}>{p.Estatus || 'N/A'}</Text>
                </View>
                <View style={cs.row}><Text style={cs.rowLabel}>Tel. Móvil:</Text><Text style={cs.rowValue}>{p.telefono_movil || 'N/A'}</Text></View>
                <View style={cs.row}><Text style={cs.rowLabel}>Tel. Fijo:</Text><Text style={cs.rowValue}>{p.telefono_fijo || 'N/A'}</Text></View>
                {p.fecha_nacimiento ? (
                    <View style={cs.row}><Text style={cs.rowLabel}>Nacimiento:</Text><Text style={cs.rowValue}>{formatDate(p.fecha_nacimiento)}</Text></View>
                ) : null}
                {p.fecha_bautismo ? (
                    <View style={cs.row}><Text style={cs.rowLabel}>Bautismo:</Text><Text style={cs.rowValue}>{formatDate(p.fecha_bautismo)}</Text></View>
                ) : null}
                {(p.calle || p.colonia) ? (
                    <View style={cs.section}>
                        <Text style={cs.sectionLabel}>Dirección:</Text>
                        <Text style={cs.sectionValue}>{p.calle}{p.num ? ` #${p.num}` : ''}{p.colonia ? `\n${p.colonia}` : ''}</Text>
                    </View>
                ) : null}
                {(p.contacto_emergencia || p.tel_contacto_emergencia) ? (
                    <View style={[cs.section, { borderTopColor: '#fca5a5' }]}>
                        <Text style={[cs.sectionLabel, { color: '#b91c1c' }]}>🚑 Emergencia:</Text>
                        {p.contacto_emergencia ? <Text style={cs.sectionValue}>{p.contacto_emergencia}</Text> : null}
                        {p.tel_contacto_emergencia ? <Text style={cs.sectionValue}>📞 {p.tel_contacto_emergencia}</Text> : null}
                    </View>
                ) : null}
                {getBadges(p).length > 0 ? (
                    <View style={cs.badgeRow}>
                        {getBadges(p).map(b => (
                            <View key={b} style={cs.badge}><Text style={cs.badgeText}>{b}</Text></View>
                        ))}
                    </View>
                ) : null}
                <Text style={cs.footer}>Congregación {getCongregacion()}</Text>
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
    const [show, setShow] = useState(false);
    const handleChange = (event, selected) => {
        const current = selected || strToDate(value);
        setShow(Platform.OS === 'ios');
        onChange(dateToStr(current));
    };
    return (
        <View style={fs.fieldGroup}>
            <Text style={fs.fieldLabel}>{label}</Text>
            <TouchableOpacity style={fs.fieldInput} onPress={() => setShow(true)}>
                <Text style={{ color: value ? '#1f2937' : '#9ca3af', fontSize: 15 }}>
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
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { maxHeight: '95%' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Editar Publicador</Text>
                        <TouchableOpacity onPress={onClose}><X size={24} color="#6b7280" /></TouchableOpacity>
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
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onClose}>
                            <Text style={styles.modalSecondaryBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalPrimaryBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalPrimaryBtnText}>Guardar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const PublicadoresScreen = ({ navigation }) => {
    const [publicadores, setPublicadores] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);   // card modal
    const [editing, setEditing] = useState(null);     // edit modal
    const [sharing, setSharing] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => { fetchPublicadores(); }, []);

    useEffect(() => {
        if (!search.trim()) { setFiltered(publicadores); return; }
        const t = search.toLowerCase();
        setFiltered(publicadores.filter(p => `${p.nombre} ${p.apellidos}`.toLowerCase().includes(t)));
    }, [search, publicadores]);

    const fetchPublicadores = async () => {
        try {
            const resp = await api.get('/publicador/all');
            const sorted = resp.data.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            setPublicadores(sorted);
            setFiltered(sorted);
        } catch {
            Alert.alert('Error', 'No se pudieron cargar los publicadores.');
        } finally {
            setLoading(false);
        }
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
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: `Tarjeta de ${selected.nombre} ${selected.apellidos}`
            });
        } catch {
            Alert.alert('Error', 'No se pudo compartir la tarjeta.');
        } finally {
            setSharing(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardLeft}><User size={22} color="#6b7280" /></View>
            <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.nombre} {item.apellidos}</Text>
                <Text style={styles.sub}>Grupo {item.grupo || '—'}{item.privilegio ? `  ·  ${item.privilegio}` : ''}</Text>
            </View>
            <View style={[styles.statusBadge, item.Estatus === 'Activo' ? styles.statusActive : styles.statusInactive]}>
                <Text style={[styles.statusText, item.Estatus === 'Activo' ? styles.statusTextActive : styles.statusTextInactive]}>
                    {item.Estatus || 'N/A'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Top bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Publicadores</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Search */}
            <View style={styles.searchWrapper}>
                <Search size={18} color="#9ca3af" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar publicador..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#9ca3af"
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}><X size={18} color="#9ca3af" /></TouchableOpacity>
                )}
            </View>

            {loading
                ? <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
                : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                        ListEmptyComponent={
                            <View style={styles.center}>
                                <Text style={{ color: '#6b7280' }}>No se encontraron publicadores</Text>
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
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Tarjeta de Publicador</Text>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <X size={24} color="#6b7280" />
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
                        <View style={[styles.modalFooter, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity
                                    style={[styles.iconBtn, styles.dangerBtn]}
                                    onPress={() => handleDelete(selected)}
                                >
                                    <Trash2 size={18} color="#ef4444" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.iconBtn]}
                                    onPress={() => { setEditing(selected); setSelected(null); }}
                                >
                                    <Edit2 size={18} color="#3b82f6" />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setSelected(null)}>
                                    <Text style={styles.modalSecondaryBtnText}>Cerrar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalPrimaryBtn, sharing && styles.disabledBtn]}
                                    onPress={handleShare}
                                    disabled={sharing}
                                >
                                    {sharing
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <><Share2 size={16} color="#fff" /><Text style={styles.modalPrimaryBtnText}>  Compartir</Text></>
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

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
    searchWrapper: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        margin: 16, marginBottom: 0, paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb',
    },
    searchInput: { flex: 1, fontSize: 16, color: '#1f2937' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    card: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 12, padding: 14,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 2,
    },
    cardLeft: { marginRight: 12 },
    cardInfo: { flex: 1 },
    name: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    statusActive: { backgroundColor: '#d1fae5' },
    statusInactive: { backgroundColor: '#fee2e2' },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextActive: { color: '#065f46' },
    statusTextInactive: { color: '#991b1b' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        maxHeight: '90%', paddingHorizontal: 16, paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    modalFooter: {
        flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8,
        paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6',
    },
    modalSecondaryBtn: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
        borderWidth: 1, borderColor: '#d1d5db',
    },
    modalSecondaryBtnText: { color: '#374151', fontWeight: '600' },
    modalPrimaryBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6',
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
    },
    modalPrimaryBtnText: { color: '#fff', fontWeight: '600' },
    disabledBtn: { backgroundColor: '#9ca3af' },
    iconBtn: {
        width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb',
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb',
    },
    dangerBtn: { borderColor: '#fecaca', backgroundColor: '#fff1f2' },
});

// ─── Card Styles ───────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
    card: { margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f0f4ff' },
    header: { backgroundColor: '#1e3a5f', padding: 20 },
    name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    typeBadge: {
        marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    },
    typeBadgeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    body: { padding: 20, gap: 10 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)', paddingBottom: 8,
    },
    rowLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    rowValue: { fontSize: 14, color: '#1f2937', fontWeight: '700' },
    section: { marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 10 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 4 },
    sectionValue: { fontSize: 14, color: '#374151' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    badge: {
        backgroundColor: '#e0e7ff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: '#c7d2fe',
    },
    badgeText: { fontSize: 12, color: '#3730a3', fontWeight: '600' },
    footer: { marginTop: 12, fontSize: 12, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' },
});

// ─── Form Styles ───────────────────────────────────────────────────────────────
const fs = StyleSheet.create({
    fieldGroup: { marginBottom: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
    fieldInput: {
        borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10,
        fontSize: 15, backgroundColor: '#f9fafb', color: '#1f2937',
    },
    selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectOption: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb',
    },
    selectOptionActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    selectOptionText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    selectOptionTextActive: { color: '#fff' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    toggleGrid: { flexWrap: 'wrap', marginBottom: 12 },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: '#1e3a5f',
        marginTop: 8, marginBottom: 10, paddingBottom: 6,
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
});

export default PublicadoresScreen;
