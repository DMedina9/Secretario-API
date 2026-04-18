import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const DashboardScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={st.container}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header */}
                <View style={st.header}>
                    <View>
                        <Text style={st.headerGreeting}>Hola,</Text>
                        <Text style={st.headerName}>Secretario</Text>
                    </View>
                </View>

                {/* Navigation Cards */}
                <View style={st.navGrid}>
                    {[
                        { screen: 'Asistencias', icon: '📅', label: 'Asistencias', color: colors.primary },
                        { screen: 'Publicadores', icon: '👥', label: 'Publicadores', color: colors.primary },
                        { screen: 'PrecursoresRegulares', icon: '📈', label: 'P. Regulares', color: colors.success },
                        { screen: 'PrecursoresAuxiliares', icon: '⭐', label: 'P. Auxiliares', color: colors.primary },
                        { screen: 'Irregulares', icon: '⚠️', label: 'Irregulares', color: colors.warning },
                        { screen: 'Informes', icon: '📋', label: 'Informes', color: colors.primary },
                        { screen: 'Secretario', icon: '📊', label: 'Formularios', color: colors.warning },
                        { screen: 'Reportes', icon: '📑', label: 'Reportes PDF', color: colors.primary },
                        { screen: 'Configuracion', icon: '⚙️', label: 'Configuración', color: colors.textSecondary },
                    ].map(item => (
                        <TouchableOpacity
                            key={item.screen}
                            style={st.navCard}
                            onPress={() => navigation.navigate(item.screen)}
                        >
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
        backgroundColor: colors.header,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingTop: 50,
    },
    headerGreeting: {
        fontSize: 14,
        color: colors.primary,
    },
    headerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.success,
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
    }
});

export default DashboardScreen;
