import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowLeft, User } from 'lucide-react-native';
import api from '../services/api';

const PublicadoresScreen = ({ navigation }) => {
    const [publicadores, setPublicadores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPublicadores();
    }, []);

    const fetchPublicadores = async () => {
        try {
            const response = await api.get('/publicadores');
            // Sort alphabetically
            const sorted = response.data.sort((a, b) => a.nombre.localeCompare(b.nombre));
            setPublicadores(sorted);
        } catch (error) {
            console.error('Error fetching publicadores:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <User size={24} color="#6b7280" />
                <View style={styles.cardInfo}>
                    <Text style={styles.name}>{item.nombre} {item.apellidos}</Text>
                    <Text style={styles.grupo}>Grupo: {item.grupo_id || 'Sin asignar'}</Text>
                </View>
                <View style={[styles.statusBadge, item.activo === 0 ? styles.statusInactive : styles.statusActive]}>
                    <Text style={[styles.statusText, item.activo === 0 ? styles.statusTextInactive : styles.statusTextActive]}>
                        {item.activo === 0 ? 'Inactivo' : 'Activo'}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Publicadores</Text>
                <View style={{ width: 24 }} /> {/* Spacer for centering */}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={publicadores}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            )}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingTop: 50, // Safe area
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    grupo: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusActive: {
        backgroundColor: '#d1fae5',
    },
    statusInactive: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextActive: {
        color: '#065f46',
    },
    statusTextInactive: {
        color: '#991b1b',
    }
});

export default PublicadoresScreen;
