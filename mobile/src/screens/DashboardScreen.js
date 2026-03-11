import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../contexts/UserContext';
import { LogOut, Calendar, Send } from 'lucide-react-native';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const { userProfile, clearProfile } = useUser();
    const [loading, setLoading] = useState(false);

    // Form state
    const [asistentes, setAsistentes] = useState('');
    const [notas, setNotas] = useState('');
    const [fecha, setFecha] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fecha;
        setShowDatePicker(Platform.OS === 'ios');
        setFecha(currentDate);
    };

    const handleRegisterAttendance = async () => {
        if (!asistentes || isNaN(asistentes)) {
            Alert.alert('Aviso', 'Por favor ingresa un número válido de asistentes.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fecha: fecha.toISOString().split('T')[0],
                asistentes: parseInt(asistentes, 10),
                notas: notas
            };

            const response = await api.post('/asistencias/add', payload);

            if (response.data.success) {
                Alert.alert(
                    '¡Éxito!',
                    `Asistencia registrada el ${fecha} con ${asistentes} asistentes.`,
                    [{ text: 'OK' }]
                );
                // Reset form
                setAsistentes('');
                setNotas('');
                setFecha(new Date());
            } else {
                Alert.alert('Error', response.data.error || 'No se pudo guardar la asistencia.');
            }

        } catch (error) {
            console.error('Error recording attendance:', error);
            Alert.alert('Error', 'No se pudo conectar con el servidor. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

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

                {/* Attendance Widget */}
                <View style={styles.widgetContainer}>
                    <View style={styles.widgetHeader}>
                        <Calendar size={20} color="#3b82f6" />
                        <Text style={styles.widgetTitle}>Registro Rápido de Asistencia</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Fecha</Text>
                        <TouchableOpacity
                            style={styles.input}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text>{fecha.toISOString().split('T')[0]}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={fecha}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onDateChange}
                            />
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Número de Asistentes</Text>
                        <TextInput
                            style={styles.input}
                            value={asistentes}
                            onChangeText={setAsistentes}
                            keyboardType="numeric"
                            placeholder="Ej. 120"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Notas (Opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={notas}
                            onChangeText={setNotas}
                            placeholder="Circunstancia especial, clima, etc."
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!asistentes || loading) && styles.submitButtonDisabled
                        ]}
                        onPress={handleRegisterAttendance}
                        disabled={!asistentes || loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Guardar Asistencia</Text>
                                <Send size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Navigation Cards */}
                <View style={styles.navGrid}>
                    {[
                        { screen: 'Publicadores', icon: '👥', label: 'Publicadores', color: '#10b981' },
                        { screen: 'PrecursoresAuxiliares', icon: '⭐', label: 'P. Auxiliares', color: '#ec4899' },
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
        paddingTop: 0,
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
