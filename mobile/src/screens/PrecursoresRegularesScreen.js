import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { Share as ShareIcon, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getPrecursoresRegulares } from '../services/repositories/InformeRepo';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useTheme } from '../contexts/ThemeContext';
import { useOrientation } from '../contexts/OrientationContext';
import FileService from '../services/FileService';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

// ─── HTML PDF Builder ─────────────────────────────────────────────────────────

const buildPdfHtml = (data, year) => {
    const monthsList = ['sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago'];
    const monthLabels = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

    const buildChartSvg = (item) => {
        const w = 600;
        const left = 44;
        const barMax = w - left - 60;
        const rowH = 18;
        const height = rowH * monthLabels.length + 10;

        const bars = monthLabels.map((label, i) => {
            const key = monthsList[i];
            const val = item[key];
            const num = (val === undefined || val === null) ? 0 : (parseFloat(val) || 0);
            const pct = Math.min(num / 90, 1);
            const barW = Math.round(pct * barMax);
            const color = num < 45 ? '#dc2626' : num < 50 ? '#d97706' : '#16a34a';
            const y = i * rowH + 14;
            return `
                <text x="8" y="${y}" font-size="11" fill="#6b7280" font-family="Arial">${label}</text>
                <rect x="${left}" y="${y - 10}" width="${barW}" height="8" rx="4" fill="${color}" />
                <rect x="${left + barW}" y="${y - 10}" width="${Math.max(barMax - barW, 0)}" height="8" rx="4" fill="#e5e7eb" />
                <text x="${left + barMax + 8}" y="${y}" font-size="11" fill="#111827" font-family="Arial">${num}</text>
            `;
        }).join('');

        return `<svg width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
    };

    const rows = data.map(item => {
        const chartSvg = buildChartSvg(item);

        const promCls = item.promedio < 45 ? 'val-danger' : item.promedio < 50 ? 'val-warning' : 'val-success';

        return `
        <div class="card">
          <div class="card-header">
            <span class="pub-name">${item.publicador}</span>
          </div>
          <div class="meta-row">
            <span class="meta">Meses: <b>${item.meses}</b></span>
            <span class="meta">Total: <b>${item.suma}</b></span>
            <span class="meta">Promedio: <b class="${promCls}">${item.promedio.toFixed(0)}</b></span>
          </div>
          <div class="chart-wrap" style="margin-top:8px">${chartSvg}</div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; color: #111827; padding: 24px; font-size: 12px; }
  h1 { font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; color: #1e293b; }
  .subtitle { text-align: center; color: #6b7280; margin-bottom: 20px; font-size: 13px; text-transform: capitalize; }
  .card { background: #fff; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
  .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; }
  .pub-name { font-weight: 700; font-size: 13px; }
  .meta-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; color: #4b5563; }
  .meta { font-size: 11px; }
  .val-danger { color: #dc2626; }
  .val-warning { color: #d97706; }
  .val-success { color: #16a34a; }
  .footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 24px; }
</style>
</head>
<body>
  <h1>Precursores Regulares</h1>
  <p class="subtitle">Año de Servicio ${year}</p>
  ${rows.length > 0 ? rows : '<p style="text-align:center;color:#6b7280">No hay datos para este año.</p>'}
  <p class="footer">Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
</body>
</html>`;
};

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
    const { isLandscape } = useOrientation();
    const st = getStyles(colors);
    const { anioServicio } = useAnioServicio();
    const [currentYear, setCurrentYear] = useState(anioServicio || dayjs().year());
    const [loading, setLoading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [data, setData] = useState([]);

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

    const handleYearChange = (newYear) => {
        setCurrentYear(newYear);
        loadData();
    };

    const onShare = async () => {
        if (!data.length) return;
        setSharing(true);
        try {
            const html = buildPdfHtml(data, currentYear);
            const { uri: pdfUri } = await Print.printToFileAsync({ html, base64: false });

            const filename = `Precursores_Regulares_${currentYear}.pdf`;
            const destUri = FileSystem.cacheDirectory + filename;
            await FileSystem.copyAsync({ from: pdfUri, to: destUri });

            await FileService.saveOrShareFile(destUri, filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setSharing(false);
        }
    };

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.headerTitle}>Precursores Regulares</Text>
                <TouchableOpacity
                    onPress={onShare}
                    disabled={loading || sharing || data.length === 0}
                    style={{ padding: 8 }}
                >
                    {sharing
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <ShareIcon size={24} color={data.length > 0 ? '#FFFFFF' : '#666'} />
                    }
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Filters */}
                <View style={st.filterCard}>
                    <View style={st.monthNavRow}>
                        <TouchableOpacity onPress={() => handleYearChange(currentYear - 1)}>
                            <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={st.monthLabel}>{currentYear}</Text>
                        <TouchableOpacity onPress={() => handleYearChange(currentYear + 1)}>
                            <ChevronRight size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
                ) : (
                    <ScrollView contentContainerStyle={st.content}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' }}>Precursores Regulares {currentYear}</Text>
                        {data.length === 0 ? (
                            <Text style={st.emptyText}>No hay datos para este año de servicio.</Text>
                        ) : (
                            data.map((item) => (
                                <View key={`${item.id}-${item.publicador}`} style={[st.card, isLandscape && st.cardLandscape]}>
                                    <View style={isLandscape ? st.leftCol : undefined}>
                                        <Text style={st.name}>{item.publicador}</Text>
                                        <View style={st.row}>
                                            <Text style={st.small}>Meses: {item.meses}</Text>
                                            <Text style={st.small}>Total: {item.suma}</Text>
                                            <Text style={[st.small, item.promedio < 45 ? st.error : item.promedio < 50 ? st.warning : st.success]}>Prom: {item.promedio.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                    <View style={isLandscape ? st.rightCol : undefined}>
                                        <MonthlyBarChart item={item} colors={colors} st={st} />
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </ScrollView>
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
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
    filterCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navArrow: { fontSize: 24, color: colors.textSecondary, paddingHorizontal: 10 },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' },

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
    cardLandscape: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
    leftCol: { flex: 0.42, paddingRight: 12 },
    rightCol: { flex: 0.58 },
});

export default PrecursoresRegularesScreen;
