import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { LogOut, Users, BookOpen, Calendar, Send } from 'lucide-react-native';
import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const { userProfile, clearProfile } = useUser();
    const [loading, setLoading] = useState(false);
    const [publicadores, setPublicadores] = useState([]);
    const [selectedPublicadorId, setSelectedPublicadorId] = useState(null);

    useEffect(() => {
        fetchPublicadores();
    }, []);

    const fetchPublicadores = async () => {
        try {
            const response = await api.get('/publicadores');
            // For the widget, we need active publishers
            const active = response.data.filter(p => p.activo !== 0);
            // Sort alphabetically
            active.sort((a, b) => a.nombre.localeCompare(b.nombre));
            setPublicadores(active);
        } catch (error) {
            console.error('Error fetching publicadores:', error);
            Alert.alert('Error', 'No se pudieron cargar los publicadores. Revisa tu conexión.');
        }
    };

    const handleRegisterAttendance = async () => {
        if (!selectedPublicadorId) {
            Alert.alert('Aviso', 'Por favor selecciona un publicador.');
            return;
        }

        setLoading(true);
        try {
            const publicador = publicadores.find(p => p.id === selectedPublicadorId);
            // Determine reunion_id automatically based on the day (just an example, customize as needed)
            // Usually, you might need a selector for reunion_id or have backend logic. 
            // Assuming today's date and a default reunion_id for this widget example.
            const payload = {
                publicador_id: selectedPublicadorId,
                fecha: new Date().toISOString().split('T')[0],
                reunion_id: 1, // Default, change as required
                asistio: true,
            };

            await api.post('/asistencias/bulk', { asistencias: [payload] });

            Alert.alert(
                '¡Éxito!',
                `Asistencia registrada para:\n${publicador.nombre} ${publicador.apellidos}`,
                [{ text: 'OK' }]
            );
            setSelectedPublicadorId(null);
        } catch (error) {
            console.error('Error recording attendance:', error);
            Alert.alert('Error', 'No se pudo guardar la asistencia. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerGreeting}>Hola,</Text>
                    <Text style={styles.headerName}>{userProfile?.nombre}</Text>
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
                <Text style={styles.widgetSubtitle}>Selecciona un publicador (Reunión actual)</Text>

                {publicadores.length === 0 ? (
                    <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
                ) : (
                    <View style={styles.listContainer}>
                        <FlatList
                            data={publicadores}
                            keyExtractor={(item) => item.id.toString()}
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => {
                                const isSelected = selectedPublicadorId === item.id;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.publicadorItem,
                                            isSelected && styles.publicadorItemSelected,
                                        ]}
                                        onPress={() => setSelectedPublicadorId(isSelected ? null : item.id)}
                                    >
                                        <Text style={[
                                            styles.publicadorName,
                                            isSelected && styles.publicadorNameSelected
                                        ]}>
                                            {item.nombre} {item.apellidos}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (!selectedPublicadorId || loading) && styles.submitButtonDisabled
                    ]}
                    onPress={handleRegisterAttendance}
                    disabled={!selectedPublicadorId || loading}
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
            <View style={styles.navContainer}>
                <TouchableOpacity
                    style={styles.navCard}
                    onPress={() => navigation.navigate('Publicadores')}
                >
                    <Users size={32} color="#10b981" />
                    <Text style={styles.navCardText}>Publicadores</Text>
                </TouchableOpacity>

                {/* You can add more cards here */}
            </View>

        </View>
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
        paddingTop: 50, // For safe area if not using SafeViewContext
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
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        flex: 1, // Let widget take available vertical space
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    widgetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 8,
    },
    widgetSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
    },
    listContainer: {
        flex: 1, // Allows the list to scroll within the widget
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        marginBottom: 16,
    },
    publicadorItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    publicadorItemSelected: {
        backgroundColor: '#eff6ff',
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
    },
    publicadorName: {
        fontSize: 16,
        color: '#374151',
    },
    publicadorNameSelected: {
        color: '#1d4ed8',
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#3b82f6',
        padding: 14,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    navContainer: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 0,
        justifyContent: 'flex-start',
    },
    navCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '48%', // Approx half with margin
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    navCardText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    }
});

export default DashboardScreen;
