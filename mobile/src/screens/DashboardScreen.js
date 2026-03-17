import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../contexts/UserContext';
import { LogOut, Calendar, Send } from 'lucide-react-native';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const { userProfile, clearProfile } = useUser();
    const [loading, setLoading] = useState(false);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerGreeting}>Hola,</Text>
                        <Text style={styles.headerName}>{userProfile?.firstName}</Text>
                    </View>
                    <TouchableOpacity onPress={clearProfile} style={styles.logoutBtn}>
                        <LogOut size={24} color="#ef4444" />
                    </TouchableOpacity>
                </View>

                {/* Navigation Cards */}
                <View style={styles.navGrid}>
                    {[
                        { screen: 'Publicadores', icon: '👥', label: 'Publicadores', color: '#10b981' },
                        { screen: 'PrecursoresAuxiliares', icon: '⭐', label: 'P. Auxiliares', color: '#ec4899' },
                        { screen: 'PrecursoresRegulares', icon: '📈', label: 'P. Regulares', color: '#14b8a6' },
                        { screen: 'Irregulares', icon: '⚠️', label: 'Irregulares', color: '#f59e0b' },
                        { screen: 'Asistencias', icon: '📅', label: 'Asistencias', color: '#3b82f6' },
                        { screen: 'Informes', icon: '📋', label: 'Informes', color: '#8b5cf6' },
                        { screen: 'Secretario', icon: '📊', label: 'Secretario', color: '#f59e0b' },
                        { screen: 'Reportes', icon: '📑', label: 'Reportes PDF', color: '#0ea5e9' },
                        { screen: 'Configuracion', icon: '⚙️', label: 'Configuración', color: '#6b7280' },
                    ].map(item => (
                        <TouchableOpacity
                            key={item.screen}
                            style={styles.navCard}
                            onPress={() => navigation.navigate(item.screen)}
                        >
                            <Text style={styles.navCardIcon}>{item.icon}</Text>
                            <Text style={[styles.navCardText, { color: item.color }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingTop: 50, // For safe area
    },
    headerGreeting: {
        fontSize: 14,
        color: '#6b7280',
    },
    headerName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    logoutBtn: {
        padding: 8,
    },
    widgetContainer: {
        backgroundColor: '#ffffff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    widgetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 8,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
        color: '#1f2937'
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    navGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        paddingTop: 16,
        gap: 12,
    },
    navCard: {
        backgroundColor: '#ffffff',
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
        color: '#374151',
    }
});

export default DashboardScreen;
