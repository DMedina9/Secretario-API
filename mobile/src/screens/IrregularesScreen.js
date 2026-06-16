import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, Share as ShareIcon } from 'lucide-react-native';
import { getIrregulares } from '../services/repositories/InformeRepo';
import { useTheme } from '../contexts/ThemeContext';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import FileService from '../services/FileService';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

// ─── HTML PDF Builder ─────────────────────────────────────────────────────────

const buildPdfHtml = (data, totals, monthLabel) => {
    const monthRow = (detalle) => {
        if (!detalle) return '';
        return detalle.map(m => {
            const bg = m.predico ? '#16a34a' : '#dc2626';
            const label = dayjs(m.mes + '-01').format('MMM');
            return `<div class="month-block">
                      <div class="month-dot" style="background:${bg}"></div>
                      <span class="month-label">${label}</span>
                    </div>`;
        }).join('');
    };

    const rows = data.map(item => {
        const estatus = item.meses_predicados > 0 ? 'Irregular' : 'Inactivo';
        const estatusColor = item.meses_predicados > 0 ? '#d97706' : '#dc2626';
        return `
        <div class="card">
          <div class="card-header">
            <span class="pub-name">${item.publicador}</span>
            <span class="estatus" style="color:${estatusColor}">${estatus}</span>
          </div>
          <div class="meta-row">
            <span class="meta">Grupo: <b>${item.grupo}</b></span>
          </div>
          <div class="months-row">${monthRow(item.detalle_meses)}</div>
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
  .summary { display: flex; justify-content: center; gap: 32px; background: #fff; border-radius: 12px; padding: 16px 24px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
  .summary-box { text-align: center; }
  .summary-value { font-size: 26px; font-weight: 700; }
  .summary-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .card { background: #fff; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
  .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; }
  .pub-name { font-weight: 700; font-size: 13px; }
  .estatus { font-weight: 700; font-size: 12px; }
  .meta-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; color: #4b5563; }
  .meta { font-size: 11px; }
  .months-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .month-block { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .month-dot { width: 18px; height: 10px; border-radius: 3px; }
  .month-label { font-size: 9px; color: #6b7280; }
  .legend { display: flex; gap: 16px; justify-content: center; margin-bottom: 16px; font-size: 11px; color: #4b5563; }
  .legend-dot { display: inline-block; width: 14px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
  .footer { text-align: center; color: #9ca3af; font-size: 10px; margin-top: 24px; }
</style>
</head>
<body>
  <h1>Reporte de Irregulares</h1>
  <p class="subtitle">${monthLabel}</p>
  <div class="summary">
    <div class="summary-box">
      <div class="summary-value" style="color:#d97706">${totals.irregulares}</div>
      <div class="summary-label">Irregulares</div>
    </div>
    <div class="summary-box">
      <div class="summary-value" style="color:#dc2626">${totals.inactivos}</div>
      <div class="summary-label">Inactivos</div>
    </div>
    <div class="summary-box">
      <div class="summary-value" style="color:#3b82f6">${data.length}</div>
      <div class="summary-label">Total</div>
    </div>
  </div>
  <div class="legend">
    <span><span class="legend-dot" style="background:#16a34a"></span>Predicó</span>
    <span><span class="legend-dot" style="background:#dc2626"></span>No predicó</span>
  </div>
  ${rows.length > 0 ? rows : '<p style="text-align:center;color:#6b7280">No hay datos para este mes.</p>'}
  <p class="footer">Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
</body>
</html>`;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
    const [sharing, setSharing] = useState(false);
    const [data, setData] = useState([]);
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'irregular' | 'inactivo'

    const loadData = async (month) => {
        if (!month) return;
        setLoading(true);
        try {
            const result = await getIrregulares(month);
            setData(result);
        } catch (error) {
            console.error('Error Irregulares locally:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (newMonth) => {
        setCurrentMonth(newMonth);
    };

    const filteredData = statusFilter === 'todos'
        ? data
        : statusFilter === 'irregular'
            ? data.filter(item => item.meses_predicados > 0)
            : data.filter(item => item.meses_predicados === 0);

    const onShare = async () => {
        if (!filteredData.length) return;
        setSharing(true);
        try {
            const monthLabel = dayjs(currentMonth).format('MMMM YYYY');
            const totals = filteredData.reduce((acc, item) => {
                if (item.meses_predicados > 0) acc.irregulares++;
                else acc.inactivos++;
                return acc;
            }, { irregulares: 0, inactivos: 0 });

            const html = buildPdfHtml(filteredData, totals, monthLabel);
            const { uri: pdfUri } = await Print.printToFileAsync({ html, base64: false });

            const filename = `Irregulares_${dayjs(currentMonth).format('YYYY-MM')}.pdf`;
            const destUri = FileSystem.cacheDirectory + filename;
            await FileSystem.copyAsync({ from: pdfUri, to: destUri });

            await FileService.saveOrShareFile(destUri, filename);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setSharing(false);
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
                        <TouchableOpacity onPress={() => handleMonthChange(currentMonth.subtract(1, 'month'))}>
                            <ChevronLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={st.monthLabel}>{dayjs(currentMonth).format('MMMM YYYY')}</Text>
                        <TouchableOpacity onPress={() => handleMonthChange(currentMonth.add(1, 'month'))}>
                            <ChevronRight size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    {/* Status filter chips */}
                    <View style={st.chipRow}>
                        {[
                            { key: 'todos', label: 'Todos', count: data.length },
                            { key: 'irregular', label: 'Irregulares', count: totals.irregulares },
                            { key: 'inactivo', label: 'Inactivos', count: totals.inactivos },
                        ].map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[
                                    st.chip,
                                    statusFilter === opt.key && st.chipActive,
                                    opt.key === 'irregular' && statusFilter === opt.key && { backgroundColor: colors.warning, borderColor: colors.warning },
                                    opt.key === 'inactivo' && statusFilter === opt.key && { backgroundColor: colors.danger, borderColor: colors.danger },
                                ]}
                                onPress={() => setStatusFilter(opt.key)}
                            >
                                <Text style={[
                                    st.chipText,
                                    statusFilter === opt.key && st.chipTextActive,
                                ]}>
                                    {opt.label} ({opt.count})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />
                ) : (
                    <>
                        {/* Summary */}
                        <View style={st.summaryContainer}>
                            <Text style={st.summaryTitle}>{dayjs(currentMonth).format('MMMM YYYY')}</Text>
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
                        ) : filteredData.length === 0 ? (
                            <Text style={st.empty}>No hay publicadores con este estatus</Text>
                        ) : (
                            filteredData.map((item) => (
                                <View key={`${item.id}-${item.publicador}`} style={st.card}>
                                    <View style={st.row}>
                                        <Text style={st.name}>{item.publicador}</Text>
                                        <Text style={[st.rowValue, { color: item.meses_predicados > 0 ? colors.warning : colors.danger }]}>
                                            {item.meses_predicados > 0 ? 'Irregular' : 'Inactivo'}
                                        </Text>
                                    </View>
                                    <View style={st.metaRow}>
                                        <Text style={st.meta}>Grupo: {item.grupo}</Text>
                                    </View>
                                    <IrregularityChart item={item} colors={colors} st={st} />
                                </View>
                            ))
                        )}
                    </>
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
    title: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
    filterCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
    monthNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthLabel: { fontSize: 18, fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' },
    chipRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
    chip: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1.5, borderColor: colors.border,
        backgroundColor: colors.inputBackground,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 16 },
    card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    row: {
        flexDirection: 'row', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8,
    },
    rowValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    summaryContainer: {
        backgroundColor: colors.card, padding: 16, borderRadius: 12,
        marginBottom: 16, elevation: 3,
    },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12, textAlign: 'center', textTransform: 'capitalize' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryBox: { alignItems: 'center' },
    summaryValue: { fontSize: 20, fontWeight: 'bold' },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    chartContainer: { flexDirection: 'row', marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, flexWrap: 'wrap' },
    chartMonth: { alignItems: 'center', gap: 4 },
    chartBlock: { width: 20, height: 10, borderRadius: 2 },
    chartMonthLabel: { fontSize: 9, color: colors.textSecondary },
});

export default IrregularesScreen;
