import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { ArrowLeft, Settings, Database, Wrench, Users, ChevronRight } from 'lucide-react-native';
import api from '../services/api';

// ─── Sub-section: Configuraciones ─────────────────────────────────────────────
const ConfiguracionesSection = () => {
    const items = [
        { key: 'nombre_congregacion', label: 'Nombre de la Congregación', desc: 'Identidad de la congregación' },
        { key: 'correo_admin', label: 'Correo del Administrador', desc: 'Correo electrónico del administrador' },
        { key: 'total_territorios', label: 'Total de Territorios', desc: 'Cantidad total de territorios' },
        { key: 'territorios_no_predicados', label: 'Territorios No Predicados', desc: 'Cantidad de territorios no predicados' },
        { key: 'mes_informe', label: 'Mes de Informe', desc: 'Referencia global de informes' },
    ];

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [inputValue, setInputValue] = useState('');

    const [configuraciones, setConfiguraciones] = useState([]);

    useEffect(() => {
        const fetchConfiguraciones = async () => {
            try {
                const response = await api.get('/configuraciones');
                setConfiguraciones(response.data.data);
            } catch (error) {
                console.error('Error al obtener configuraciones:', error);
            }
        };
        fetchConfiguraciones();
    }, []);

    const handleEditConfig = async (type) => {
        setSelectedConfig(type);
        const configuracion = configuraciones.find(c => c.clave === type);
        setInputValue(configuracion?.valor || '');
        setIsModalVisible(true);
    };

    const handleSaveConfig = async () => {
        if (!inputValue.trim()) {
            Alert.alert('Error', 'El valor no puede estar vacío.');
            return;
        }

        try {
            await api.put(`/configuraciones/${selectedConfig}`, { value: inputValue });
            Alert.alert('Éxito', 'Configuración actualizada correctamente.');
            setIsModalVisible(false);
            // Aquí podrías recargar los datos si es necesario
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la configuración.');
        }
    };

    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>⚙️ Configuraciones del Sistema</Text>
            {items.map((item, i) => (
                <TouchableOpacity key={i} style={s.configRow} onPress={() => handleEditConfig(item.key)}>
                    <View>
                        <Text style={s.configLabel}>{item.label}</Text>
                        <Text style={s.configDesc}>{item.desc}</Text>
                    </View>
                    <ChevronRight size={18} color="#9ca3af" />
                </TouchableOpacity>
            ))}

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Editar {selectedConfig}</Text>
                        <TextInput
                            style={s.modalInput}
                            placeholder={`Ingrese el nuevo valor para ${selectedConfig}`}
                            value={inputValue}
                            onChangeText={setInputValue}
                            keyboardType="default"
                        />
                        <View style={s.modalButtons}>
                            <TouchableOpacity
                                style={[s.modalButton, s.modalButtonCancel]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={s.modalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modalButton, s.modalButtonSave]}
                                onPress={handleSaveConfig}
                            >
                                <Text style={s.modalButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─── Sub-section: Gestión de Datos ────────────────────────────────────────────
const GestionDatosSection = () => {
    const [loading, setLoading] = useState(null);

    const handleExport = async (type) => {
        Alert.alert('Exportar', `La exportación de ${type} se realiza desde la versión web.`);
    };

    const actions = [
        { key: 'publicadores', label: 'Exportar Publicadores', icon: '📋' },
        { key: 'asistencias', label: 'Exportar Asistencias', icon: '📊' },
        { key: 'informes', label: 'Exportar Informes', icon: '📈' },
    ];

    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>📊 Gestión de Datos</Text>
            <Text style={s.cardSubtitle}>Importar/exportar datos desde la versión web para mayor funcionalidad.</Text>
            {actions.map(a => (
                <TouchableOpacity key={a.key} style={s.actionRow} onPress={() => handleExport(a.label)}>
                    <Text style={s.actionIcon}>{a.icon}</Text>
                    <Text style={s.actionLabel}>{a.label}</Text>
                    <ChevronRight size={18} color="#9ca3af" />
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ─── Sub-section: Mantenimiento ───────────────────────────────────────────────
const MantenimientoSection = () => {
    const [loading, setLoading] = useState(null);

    const handleClean = (type) => {
        Alert.alert(
            'Confirmar',
            `¿Estás seguro de que deseas limpiar los registros antiguos de ${type}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpiar', style: 'destructive', onPress: async () => {
                        setLoading(type);
                        try {
                            await api.delete(`/mantenimiento/${type}`);
                            Alert.alert('✅ Hecho', `Registros de ${type} eliminados.`);
                        } catch {
                            Alert.alert('Error', 'No se pudo completar la operación.');
                        } finally {
                            setLoading(null);
                        }
                    }
                }
            ]
        );
    };

    const actions = [
        { key: 'informes', label: 'Limpiar Informes Antiguos', color: '#ef4444' },
        { key: 'asistencias', label: 'Limpiar Asistencias Antiguas', color: '#f97316' },
    ];

    return (
        <View style={s.card}>
            <Text style={s.cardTitle}>🗑️ Mantenimiento</Text>
            <Text style={s.cardSubtitle}>Elimina registros históricos para mantener la base de datos limpia.</Text>
            {actions.map(a => (
                <TouchableOpacity
                    key={a.key}
                    style={[s.dangerRow, loading === a.key && { opacity: 0.5 }]}
                    onPress={() => handleClean(a.key)}
                    disabled={!!loading}
                >
                    {loading === a.key
                        ? <ActivityIndicator size="small" color={a.color} />
                        : <Text style={[s.dangerLabel, { color: a.color }]}>{a.label}</Text>
                    }
                </TouchableOpacity>
            ))}
        </View>
    );
};

// ─── Sub-section: Usuarios ────────────────────────────────────────────────────
const UsuariosSection = () => (
    <View style={s.card}>
        <Text style={s.cardTitle}>👥 Usuarios</Text>
        <Text style={s.cardSubtitle}>La gestión de usuarios (crear, editar, eliminar cuentas) está disponible únicamente en la versión web por razones de seguridad.</Text>
        <View style={s.infoBox}>
            <Text style={s.infoText}>💡 Accede desde un navegador en la misma red local para gestionar cuentas de usuario.</Text>
        </View>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ConfiguracionScreen = ({ navigation }) => {
    const [section, setSection] = useState('configuraciones');

    const sections = [
        { key: 'configuraciones', label: 'Config.', icon: <Settings size={16} color="#fff" /> },
        { key: 'gestion', label: 'Datos', icon: <Database size={16} color="#fff" /> },
        { key: 'mantenimiento', label: 'Mant.', icon: <Wrench size={16} color="#fff" /> },
        { key: 'usuarios', label: 'Usuarios', icon: <Users size={16} color="#fff" /> },
    ];

    return (
        <View style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
                <Text style={s.headerTitle}>Configuración</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tab bar */}
            <View style={s.tabBar}>
                {sections.map(sec => (
                    <TouchableOpacity
                        key={sec.key}
                        style={[s.tabItem, section === sec.key && s.tabItemActive]}
                        onPress={() => setSection(sec.key)}
                    >
                        <Text style={[s.tabLabel, section === sec.key && s.tabLabelActive]}>{sec.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {section === 'configuraciones' && <ConfiguracionesSection />}
                {section === 'gestion' && <GestionDatosSection />}
                {section === 'mantenimiento' && <MantenimientoSection />}
                {section === 'usuarios' && <UsuariosSection />}
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
    tabBar: {
        flexDirection: 'row', backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabItemActive: { borderBottomColor: '#3b82f6' },
    tabLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
    tabLabelActive: { color: '#3b82f6', fontWeight: '700' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
    cardSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
    configRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    configLabel: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
    configDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
    },
    actionIcon: { fontSize: 18, marginRight: 12 },
    actionLabel: { flex: 1, fontSize: 15, color: '#374151' },
    dangerRow: {
        borderWidth: 1, borderColor: '#fecaca', borderRadius: 8,
        padding: 14, marginBottom: 10, alignItems: 'center',
        backgroundColor: '#fff1f2',
    },
    dangerLabel: { fontSize: 15, fontWeight: '600' },
    infoBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 14 },
    infoText: { fontSize: 14, color: '#1d4ed8', lineHeight: 20 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    modalButtonCancel: {
        backgroundColor: '#ccc',
    },
    modalButtonSave: {
        backgroundColor: '#28a745',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ConfiguracionScreen;
