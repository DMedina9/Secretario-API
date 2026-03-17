import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import api from '../services/api';
import { useAnioServicio } from '../contexts/AnioServicioContext';

dayjs.locale('es');

const IrregularesScreen = ({ navigation }) => {
    const { anioServicio } = useAnioServicio();
    const [mesFinal, setMesFinal] = useState(dayjs().subtract(1, 'month').format('YYYY-MM'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const loadData = async () => {
        if (!mesFinal || !/^\d{4}-\d{2}$/.test(mesFinal)) {
            return;
        }
        setLoading(true);
        try {
            const resp = await api.get(`/informe/irregulares/${mesFinal}`);
            setData(resp.data?.data || []);
        } catch (error) {
            console.error('Error Irregulares:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text style={styles.title}>Irregulares</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filter}>
                <TextInput
                    style={styles.input}
                    value={mesFinal}
                    onChangeText={setMesFinal}
                    keyboardType="numeric"
                    placeholder="Mes final (YYYY-MM)"
                />
                <TouchableOpacity style={styles.btn} onPress={loadData}>
                    <Text style={styles.btnText}>Buscar</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 16 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.list}>
                    {data.length === 0 ? (
                        <Text style={styles.empty}>No hay datos para este año</Text>
                    ) : (
                        data.map((item) => (
                            <View key={`${item.id}-${item.publicador}`} style={styles.card}>
                                <View style={styles.row}>
                                    <Text style={styles.name}>{item.publicador}</Text>
                                    <Text style={[styles.rowValue, { color: item.meses_predicados > 0 ? '#E9D502' : '#991b1b' }]}>{item.meses_predicados>0 ? 'Irregular': 'Inactivo'}</Text>
                                </View>
                                <Text style={styles.meta}>Objetivo: {item.meses_a_predicar}</Text>
                                <Text style={styles.meta}>Predicó: {item.meses_predicados}</Text>
                                <Text style={styles.meta}>Faltantes: {item.meses_faltantes}</Text>
                                <Text style={styles.meta}>Seguidos sin predicar: {item.consecutivos_sin_predicar}</Text>
                                <Text style={styles.detail}>Detalle: {item.detalle_meses?.map((m) => `${m.mes}:${m.predico ? '✓' : '✗'}`).join(' ')}</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    filter: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#fff', color: '#111' },
    btn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, marginLeft: 8 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center', color: '#6b7280', marginTop: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
    meta: { fontSize: 13, color: '#374151', marginTop: 2 },
    detail: { fontSize: 12, color: '#4b5563', marginTop: 6 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)', paddingBottom: 8,
    },
    rowLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    rowValue: { fontSize: 14, color: '#1f2937', fontWeight: '700' },
});

export default IrregularesScreen;
