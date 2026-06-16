import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Share as ShareIcon } from 'lucide-react-native';
import { getAllPublicadores } from '../services/repositories/PublicadorRepo';
import { useTheme } from '../contexts/ThemeContext';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import FileService from '../services/FileService';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const buildHtml = (groups) => {
    const groupHtml = groups.map((g, idx) => {
        const members = g.items.map(p => `
            <div class="member-row">
                <div class="name">${p.apellidos}, ${p.nombre}</div>
                <div class="info">Dirección: ${p.calle} ${p.num}, ${p.colonia}</div>
                <div class="info">Tel. Móvil: ${p.telefono_movil || '—'}</div>
                <div class="info">Tel. Fijo: ${p.telefono_fijo || '—'}</div>
                <div class="info">Contacto: ${p.contacto_emergencia || '—'} ${p.tel_contacto_emergencia ? '· ' + p.tel_contacto_emergencia : ''}</div>
            </div>
        `).join('');

        // page-break before except first
        const pageBreak = idx === 0 ? '' : 'page-break-before: always;';
        return `
          <section class="group" style="${pageBreak}">
            <h2>Grupo ${g.name}</h2>
            ${members || '<p>No hay publicadores en este grupo.</p>'}
          </section>
        `;
    }).join('');

    return `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#111}
        h1{text-align:center}
        h2{background:#f3f4f6;padding:10px;border-radius:6px}
        .member-row{padding:10px;border-bottom:1px solid #e5e7eb}
        .name{font-weight:700}
        .info{font-size:12px;color:#374151}
        @media print { .group{page-break-inside: avoid;} }
      </style>
    </head>
    <body>
      <h1>Datos de Contacto</h1>
      <p style="text-align:center;color:#6b7280">Generado el ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
      ${groupHtml}
    </body>
    </html>`;
};

const DatosContactoScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const st = getStyles(colors);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [sharing, setSharing] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const all = await getAllPublicadores();
            setData(all);
        } catch (e) {
            console.error(e);
            setData([]);
        } finally { setLoading(false); }
    };

    const grouped = React.useMemo(() => {
        const map = {};
        (data || []).forEach(p => {
            const g = p.grupo || '—';
            if (!map[g]) map[g] = [];
            map[g].push(p);
        });
        return Object.keys(map).sort((a, b) => (a === '—' ? 1 : (b === '—' ? -1 : a - b))).map(k => ({ name: k, items: map[k] }));
    }, [data]);

    const onShare = async () => {
        if (!data.length) return;
        setSharing(true);
        try {
            const html = buildHtml(grouped);
            const { uri: pdfUri } = await Print.printToFileAsync({ html });
            const filename = `Datos_Contacto_${dayjs().format('YYYY-MM-DD')}.pdf`;
            const destUri = FileSystem.cacheDirectory + filename;
            await FileSystem.copyAsync({ from: pdfUri, to: destUri });
            await FileService.saveOrShareFile(destUri, filename);
        } catch (e) {
            console.error('Error generando PDF:', e);
        } finally { setSharing(false); }
    };

    return (
        <View style={st.container}>
            <View style={st.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={st.title}>Datos de Contacto</Text>
                <TouchableOpacity onPress={onShare} disabled={sharing || loading} style={{ padding: 8 }}>
                    {sharing ? <ActivityIndicator size="small" color="#FFFFFF" /> : <ShareIcon size={24} color="#FFFFFF" />}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    grouped.map(g => (
                        <View key={g.name} style={st.groupCard}>
                            <Text style={st.groupTitle}>Grupo {g.name}</Text>
                            {g.items.map(p => (
                                <View key={p.id} style={st.memberRow}>
                                    <Text style={st.memberName}>{p.apellidos}, {p.nombre}</Text>
                                    <Text style={st.memberInfo}>Dirección: {p.calle} {p.num}, {p.colonia}</Text>
                                    <Text style={st.memberInfo}>Tel. Móvil: {p.telefono_movil || '—'}</Text>
                                    <Text style={st.memberInfo}>Tel. Fijo: {p.telefono_fijo || '—'}</Text>
                                    <Text style={st.memberInfo}>Contacto: {p.contacto_emergencia || '—'} {p.tel_contacto_emergencia ? '· ' + p.tel_contacto_emergencia : ''}</Text>
                                </View>
                            ))}
                        </View>
                    ))
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
    groupCard: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 12 },
    groupTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
    memberRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
    memberName: { fontWeight: '700', color: colors.text },
    memberInfo: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});

export default DatosContactoScreen;
