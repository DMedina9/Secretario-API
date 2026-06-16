import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Settings, Moon, Sun } from 'lucide-react-native';
import { getAllConfiguraciones } from '../services/repositories/ConfiguracionesRepo';

const DashboardScreen = ({ navigation }) => {
    const { colors, toggleTheme } = useTheme();
    const st = getStyles(colors);
    const diaMes = dayjs().format('DD') * 1;
    const [mode, setMode] = useState(colors.mode);
    const [configuraciones, setConfiguraciones] = useState([]);
    useEffect(() => {
        const fetchConfiguraciones = async () => {
            try {
                const data = await getAllConfiguraciones();
                setConfiguraciones(data);
            } catch (error) {
                console.error('Error loading config for card:', error);
            }
        };
        fetchConfiguraciones();
    }, []);

    const getCongregacion = () => {
        const configuracion = configuraciones.find(c => c.clave === 'nombre_congregacion');
        return configuracion?.valor || '';
    };

    const toggleMode = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        toggleTheme();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={st.container}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header */}
                <View style={st.header}>
                    <View style={st.headerInfo}>
                        <Text style={st.headerGreeting}>Hola,</Text>
                        <Text style={st.headerName}>Secretario</Text>
                        <Text style={st.headerCongregacion}>{getCongregacion()}</Text>
                    </View>
                    <View style={st.headerActions}>
                        <TouchableOpacity style={st.headerButton} onPress={() => toggleMode()}>
                            {mode === 'dark' ? <Sun size={26} strokeWidth={2.2} color={colors.primary} /> : <Moon size={26} strokeWidth={2.2} color={colors.primary} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={st.headerButton} onPress={() => navigation.navigate('Configuracion')}>
                            <Settings size={26} strokeWidth={2.2} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Navigation Cards */}
                <View style={st.navGrid}>
                    {[
                        { screen: 'Publicadores', icon: '👥', label: 'Publicadores', color: colors.primary },
                        { screen: 'DatosContacto', icon: '📇', label: 'Datos de Contacto', color: colors.primary },
                        { screen: 'Asistencias', icon: '📅', label: 'Asistencias', color: colors.primary },
                        { screen: 'Irregulares', icon: '⚠️', label: 'Irregulares', color: colors.warning },
                        { screen: 'Informes', icon: '📋', label: 'Informes', color: colors.primary },
                        { screen: 'InformesFaltantes', icon: '📝', label: 'Faltantes', color: colors.primary },
                        { screen: 'PrecursoresRegulares', icon: '📈', label: 'P. Regulares', color: colors.success },
                        { screen: 'PrecursoresAuxiliares', icon: '⭐', label: 'P. Auxiliares', color: colors.primary },
                        { screen: 'Formularios', icon: '📊', label: 'Formularios', color: colors.warning },
                        { screen: 'Reportes', icon: '📑', label: 'Reportes', color: colors.primary }
                    ].map(item => (
                        <TouchableOpacity
                            key={item.screen}
                            style={st.navCard}
                            onPress={() => navigation.navigate(item.screen)}
                            disabled={item.screen === 'Informes' && diaMes > 20}
                        >
                            {item.screen === 'Informes' && diaMes > 10 && diaMes <= 20 ? (
                                <View style={st.badge}>
                                    <Text style={st.badgeText}>{diaMes}</Text>
                                </View>
                            ) : null}
                            <Text style={st.navCardIcon}>{item.icon}</Text>
                            <Text style={[st.navCardText, { color: item.color }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: 50,
    },
    headerInfo: {
        flexDirection: 'column',
        gap: 5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 0.2,
        borderColor: colors.primary,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerGreeting: {
        fontSize: 14,
        color: colors.primary,
    },
    headerName: {
        fontSize: 22,
        color: colors.success,
    },
    headerCongregacion: {
        fontSize: 14,
        color: colors.text,
    },
    navGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 16,
        gap: 12,
    },
    navCard: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    navCardIcon: {
        fontSize: 30,
        marginBottom: 6,
    },
    navCardText: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: colors.error,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
