import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, Share as ShareIcon, RefreshCcw } from 'lucide-react-native';
import { getIrregulares } from '../services/repositories/InformeRepo';
import { syncAllData } from '../services/SyncService';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAnioServicio } from '../contexts/AnioServicioContext';

dayjs.locale('es');

const IrregularityChart = ({ item, colors, st }) => {
    if (!item.detalle_meses) return null;
    return (
        <View style={st.chartContainer}>
            {item.detalle_meses.map((m, idx) => (
                <View key={idx} style={st.chartMonth}>
                    <View style={[st.chartBlock, { backgroundColor: m.predico ? colors.success : colors.danger }]} />
                    <Text style={st.chartMonthLabel}>{dayjs(m.mes + '-01').format('MMM')}</Text>
                </View>
            ))}
        </View>
    );
};

const IrregularesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const { mesInforme } = useAnioServicio();
    const [currentMonth, setCurrentMonth] = useState(mesInforme);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const viewShotRef = useRef();

    const loadData = async (month) => {
        if (!month) return;
        setLoading(true);
        try {
            const data = await getIrregulares(month);
            setData(data);
        } catch (error) {
            console.error('Error Irregulares locally:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        loadData(currentMonth.format('YYYY-MM-01'));
    };

    const handleMonthChange = (newMonth) => {
        setCurrentMonth(newMonth);
    };

    const onShare = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 0.8,
            });
            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error('Error sharing image:', error);
        }
    };

    useEffect(() => {
        loadData(currentMonth.format('YYYY-MM-01'));
    }, [currentMonth]);

    const totals = data.reduce((acc, item) => {
        if (item.meses_predicados > 0) acc.irregulares++;
        else acc.inactivos++;
        return acc;
    }, { irregulares: 0, inactivos: 0 });

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.title}>Irregulares</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={onShare} disabled={loading || data.length === 0} style={{ padding: 8 }}>
                        <ShareIcon size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSync} style={{ padding: 8, marginLeft: 8 }}>
                        <RefreshCcw size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.subtract(1, 'month'))}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{currentMonth.format('MMMM YYYY')}</Text>
                <TouchableOpacity onPress={() => handleMonthChange(currentMonth.add(1, 'month'))}><ChevronRight size={24} color={colors.text} /></TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
            ) : (
                <ScrollView contentContainerStyle={st.list}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ backgroundColor: colors.background, paddingVertical: 10 }}>
                        <View style={st.summaryContainer}>
                            <Text style={st.summaryTitle}>{currentMonth.format('MMMM YYYY')}</Text>
                            <View style={st.summaryRow}>
                                <View style={st.summaryBox}>
                                    <Text style={[st.summaryValue, { color: colors.warning }]}>{totals.irregulares}</Text>
                                    <Text style={st.summaryLabel}>Irregulares</Text>
                                </View>
                                <View style={st.summaryBox}>
                                    <Text style={[st.summaryValue, { color: colors.danger }]}>{totals.inactivos}</Text>
                                    <Text style={st.summaryLabel}>Inactivos</Text>
                                </View>
                                <View style={st.summaryBox}>
                                    <Text style={[st.summaryValue, { color: colors.primary }]}>{data.length}</Text>
                                    <Text style={st.summaryLabel}>Total</Text>
                                </View>
                            </View>
                        </View>

                        {data.length === 0 ? (
                            <Text style={st.empty}>No hay datos para este mes</Text>
                        ) : (
                            data.map((item) => (
                                <View key={`${item.id}-${item.publicador}`} style={st.card}>
                                    <View style={st.row}>
                                        <Text style={st.name}>{item.publicador}</Text>
                                        <Text style={[st.rowValue, { color: item.meses_predicados > 0 ? colors.warning : colors.danger }]}>{item.meses_predicados > 0 ? 'Irregular' : 'Inactivo'}</Text>
                                    </View>
                                    <View style={st.metaRow}>
                                        <Text style={st.meta}>Objetivo: {item.meses_a_predicar}</Text>
                                        <Text style={st.meta}>Predicó: {item.meses_predicados}</Text>
                                        <Text style={st.meta}>Faltantes: {item.meses_faltantes}</Text>
                                    </View>
                                    <Text style={st.meta}>Meses consecutivos sin predicar: {item.consecutivos_sin_predicar}</Text>

                                    <IrregularityChart item={item} colors={colors} st={st} />
                                </View>
                            ))
                        )}
                    </ViewShot>
                </ScrollView>
            )}
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    filter: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, backgroundColor: colors.inputBackground, color: colors.inputText },
    btn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, marginLeft: 8 },
    btnText: { color: '#fff', fontWeight: 'bold' },
    list: { padding: 16, paddingBottom: 40 },
    empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 16 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    detail: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8,
    },
    rowLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    rowValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    summaryContainer: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 16, marginHorizontal: 16, elevation: 3 },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12, textAlign: 'center' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryBox: { alignItems: 'center' },
    summaryValue: { fontSize: 20, fontWeight: 'bold' },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    chartContainer: { flexDirection: 'row', marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
    chartMonth: { alignItems: 'center', gap: 4 },
    chartBlock: { width: 20, height: 10, borderRadius: 2 },
    chartMonthLabel: { fontSize: 9, color: colors.textSecondary },
});

export default IrregularesScreen;
