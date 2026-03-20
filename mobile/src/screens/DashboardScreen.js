import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, Calendar, Send } from 'lucide-react-native';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const { userProfile, clearProfile } = useUser();
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(false);

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
                        <Text style={st.headerName}>{userProfile?.firstName}</Text>
                    </View>
                    <TouchableOpacity onPress={clearProfile} style={st.logoutBtn}>
                        <LogOut size={24} color={colors.danger} />
                    </TouchableOpacity>
                </View>

                {/* Navigation Cards */}
                <View style={st.navGrid}>
                    {[
                        { screen: 'Publicadores', icon: '👥', label: 'Publicadores', color: colors.primary },
                        { screen: 'PrecursoresAuxiliares', icon: '⭐', label: 'P. Auxiliares', color: colors.primary },
                        { screen: 'PrecursoresRegulares', icon: '📈', label: 'P. Regulares', color: colors.success },
                        { screen: 'Irregulares', icon: '⚠️', label: 'Irregulares', color: colors.warning },
                        { screen: 'Asistencias', icon: '📅', label: 'Asistencias', color: colors.primary },
                        { screen: 'Informes', icon: '📋', label: 'Informes', color: colors.primary },
                        { screen: 'Secretario', icon: '📊', label: 'Secretario', color: colors.warning },
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
    logoutBtn: {
        padding: 8,
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
