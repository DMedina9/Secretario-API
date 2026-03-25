import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { Share as ShareIcon, ArrowLeft, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react-native';
import { getPrecursoresRegulares } from '../services/repositories/InformeRepo';
import { syncAllData } from '../services/SyncService';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useTheme } from '../contexts/ThemeContext';
import FileService from '../services/FileService';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const MonthlyBarChart = ({ item, colors, st }) => {
    const months = [
        { key: 'sep', label: 'Sep' },
        { key: 'oct', label: 'Oct' },
        { key: 'nov', label: 'Nov' },
        { key: 'dic', label: 'Dic' },
        { key: 'ene', label: 'Ene' },
        { key: 'feb', label: 'Feb' },
        { key: 'mar', label: 'Mar' },
        { key: 'abr', label: 'Abr' },
        { key: 'may', label: 'May' },
        { key: 'jun', label: 'Jun' },
        { key: 'jul', label: 'Jul' },
        { key: 'ago', label: 'Ago' },
    ];

    return (
        <View style={st.chartContainer}>
            {months.map((m) => {
                const value = item[m.key];
                if (value === undefined || value === null) return null;

                const numValue = parseFloat(value) || 0;
                const barWidth = Math.min((numValue / 90) * 100, 100) + '%';
                const barColor = numValue < 45 ? colors.danger : numValue < 50 ? colors.warning : colors.success;

                return (
                    <View key={m.key} style={st.chartRow}>
                        <Text style={st.chartLabel}>{m.label}</Text>
                        <View style={st.barWrapper}>
                            <View style={st.barBackground}>
                                <View style={[st.bar, { width: barWidth, backgroundColor: barColor }]} />
                            </View>
                            <Text style={st.barValue}>{numValue}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const PrecursoresRegularesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const { anioServicio } = useAnioServicio();
    const [currentYear, setCurrentYear] = useState(anioServicio || dayjs().year());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const viewShotRef = useRef();

    useEffect(() => {
        if (currentYear) {
            loadData();
        }
    }, [currentYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rows = await getPrecursoresRegulares(currentYear);
            setData(rows);
        } catch (error) {
            console.error('Error loading precursores regulares locally:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        await syncAllData();
        loadData();
    };

    const handleYearChange = (newYear) => {
        setCurrentYear(newYear);
        loadData();
    };

    const onShare = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 0.8,
            });
            const filename = `Precursores_Regulares_${currentYear}.png`;
            await FileService.saveAndShareFile(uri, filename);
        } catch (error) {
            console.error('Error sharing image:', error);
        }
    };

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Precursores Regulares</Text>
                <TouchableOpacity onPress={onShare} disabled={loading || data.length === 0}>
                    <ShareIcon size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSync} style={{ marginLeft: 15 }}>
                    <RefreshCcw size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 16, backgroundColor: colors.header, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 }}>
                <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}><ChevronLeft size={24} color={colors.text} /></TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>{currentYear}</Text>
                <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}><ChevronRight size={24} color={colors.text} /></TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
            ) : (
                <ScrollView contentContainerStyle={st.content}>
                    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }} style={{ backgroundColor: colors.background, padding: 10 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' }}>Precursores Regulares {currentYear}</Text>
                        {data.length === 0 ? (
                            <Text style={st.emptyText}>No hay datos para este año de servicio.</Text>
                        ) : (
                            data.map((item) => (
                                <View key={`${item.id}-${item.publicador}`} style={st.card}>
                                    <Text style={st.name}>{item.publicador}</Text>
                                    <View style={st.row}>
                                        <Text style={st.small}>Meses: {item.meses}</Text>
                                        <Text style={st.small}>Total: {item.suma}</Text>
                                        <Text style={[st.small, item.promedio < 45 ? st.error : item.promedio < 50 ? st.warning : st.success]}>Prom: {item.promedio.toFixed(0)}</Text>
                                    </View>
                                    <MonthlyBarChart item={item} colors={colors} st={st} />
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
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: colors.header,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    filterRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
    label: { fontSize: 14, color: colors.text, marginRight: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.inputBackground, color: colors.inputText },
    button: { marginLeft: 8, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold' },
    content: { padding: 16, paddingBottom: 40 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    small: { fontSize: 12, color: colors.textSecondary, marginRight: 10 },
    monthRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
    monthLabel: { fontSize: 12, color: colors.text, marginRight: 8, marginBottom: 4 },
    error: { color: colors.danger },
    warning: { color: colors.warning },
    success: { color: colors.success },
    chartContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
    chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    chartLabel: { width: 35, fontSize: 11, color: colors.textSecondary },
    barWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    barBackground: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 4 },
    barValue: { width: 25, fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'right' },
});

export default PrecursoresRegularesScreen;
