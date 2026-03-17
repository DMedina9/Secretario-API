import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import api from '../services/api';
import { useAnioServicio } from '../contexts/AnioServicioContext';

dayjs.locale('es');

const PrecursoresRegularesScreen = ({ navigation }) => {
    const { anioServicio } = useAnioServicio();
    const [filterAnio, setFilterAnio] = useState(anioServicio || dayjs().year());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    useEffect(() => {
        if (filterAnio) {
            loadData();
        }
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const resp = await api.get(`/informe/precursoresRegulares/${filterAnio}`);
            const rows = resp.data?.data || [];
            setData(rows);
        } catch (error) {
            console.error('Error loading precursores regulares:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (!filterAnio || isNaN(parseInt(filterAnio, 10))) {
            return;
        }
        loadData();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Precursores Regulares</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filterRow}>
                <Text style={styles.label}>Año de Servicio</Text>
                <TextInput
                    style={styles.input}
                    value={String(filterAnio)}
                    onChangeText={setFilterAnio}
                    keyboardType="numeric"
                />
                <TouchableOpacity style={styles.button} onPress={handleSearch}>
                    <Text style={styles.buttonText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 32 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {data.length === 0 ? (
                        <Text style={styles.emptyText}>No hay datos para este año de servicio.</Text>
                    ) : (
                        data.map((item) => (
                            <View key={`${item.id}-${item.publicador}`} style={styles.card}>
                                <Text style={styles.name}>{item.publicador}</Text>
                                {/*<View style={styles.row}>
                                    <Text style={styles.sub}>Inicio: {item.inicio_precursorado ? dayjs(item.inicio_precursorado).format('DD/MM/YYYY') : '-'}</Text>
                                    <Text style={styles.sub}>Años: {item.anios_precursorado}</Text>
                                </View>*/}
                                <View style={styles.row}>
                                    <Text style={styles.small}>Meses: {item.meses}</Text>
                                    <Text style={styles.small}>Total: {item.suma}</Text>
                                    <Text style={[styles.small, item.promedio<45? styles.error: item.promedio < 50? styles.warning: styles.success]}>Prom: {item.promedio.toFixed(0)}</Text>
                                </View>
                                <View style={styles.monthRow}>
                                    {item.sep && <Text style={styles.monthLabel}>Sep {item.sep}</Text>}
                                    {item.oct && <Text style={styles.monthLabel}>Oct {item.oct}</Text>}
                                    {item.nov && <Text style={styles.monthLabel}>Nov {item.nov}</Text>}
                                    {item.dic && <Text style={styles.monthLabel}>Dic {item.dic}</Text>}
                                    {item.ene && <Text style={styles.monthLabel}>Ene {item.ene}</Text>}
                                    {item.feb && <Text style={styles.monthLabel}>Feb {item.feb}</Text>}
                                    {item.mar && <Text style={styles.monthLabel}>Mar {item.mar}</Text>}
                                    {item.abr && <Text style={styles.monthLabel}>Abr {item.abr}</Text>}
                                    {item.may && <Text style={styles.monthLabel}>May {item.may}</Text>}
                                    {item.jun && <Text style={styles.monthLabel}>Jun {item.jun}</Text>}
                                    {item.jul && <Text style={styles.monthLabel}>Jul {item.jul}</Text>}
                                    {item.ago && <Text style={styles.monthLabel}>Ago {item.ago}</Text>}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    filterRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
    label: { fontSize: 14, color: '#374151', marginRight: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', color: '#1f2937' },
    button: { marginLeft: 8, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    content: { padding: 16, paddingBottom: 40 },
    emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    sub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    small: { fontSize: 12, color: '#374151', marginRight: 10 },
    monthRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    monthLabel: { fontSize: 12, color: '#1f2937', marginRight: 8, marginBottom: 4 },
    error: { color: 'red'},
    warning: {color: '#E9D502'},
    success: {color: 'green'},
});

export default PrecursoresRegularesScreen;
