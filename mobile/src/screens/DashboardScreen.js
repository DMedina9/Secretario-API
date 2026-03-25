import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, RefreshCcw } from 'lucide-react-native';
import { syncAllData, syncIfNeeded } from '../services/SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = ({ navigation }) => {
    const { userProfile, clearProfile } = useUser();
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState('');

    React.useEffect(() => {
        loadLastSync();
        // Automatic sync only if needed (once a month)
        handleInitialSync();
    }, []);

    const loadLastSync = async () => {
        const ls = await AsyncStorage.getItem('@last_sync');
        if (ls) setLastSync(new Date(ls).toLocaleString());
    };

    const handleInitialSync = async () => {
        setSyncing(true);
        await syncIfNeeded();
        setSyncing(false);
        loadLastSync();
    };

    const handleSync = async () => {
        setSyncing(true);
        const success = await syncAllData();
        setSyncing(false);
        if (success) {
            loadLastSync();
        }
    };

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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                        <TouchableOpacity onPress={handleSync} disabled={syncing} style={st.actionBtn}>
                            {syncing
                                ? <ActivityIndicator size="small" color={colors.primary} />
                                : <RefreshCcw size={24} color={colors.primary} />
                            }
                        </TouchableOpacity>
                        <TouchableOpacity onPress={clearProfile} style={st.logoutBtn}>
                            <LogOut size={24} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {lastSync ? (
                    <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginBottom: 10 }}>
                        Última sincronización: {lastSync}
                    </Text>
                ) : null}

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
    logoutBtn: {
        padding: 8,
    },
    actionBtn: {
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
