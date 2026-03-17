import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { useUser } from '../contexts/UserContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Dimensions } from 'react-native';

const PDFViewerScreen = ({ route, navigation }) => {
  const { endpoint, method = 'GET', body = null, filename = 'document.pdf', fileUri: initialFileUri = null } = route.params || {};
  const { token } = useUser();
  const [loading, setLoading] = useState(true);
  const [fileUri, setFileUri] = useState(null);
  const [webViewAvailable, setWebViewAvailable] = useState(true);

  useEffect(() => {
    try {
      // eslint-disable-next-line global-require
      require('react-native-webview');
      setWebViewAvailable(true);
    } catch (e) {
      setWebViewAvailable(false);
    }

    if (initialFileUri) {
      setFileUri(initialFileUri);
      setLoading(false);
      return;
    }

    downloadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadPdf = async () => {
    setLoading(true);
    try {
      // Build full url based on whether caller passed full URL or relative path
      let fullUrl = endpoint;

      const options = {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }

      const response = await fetch(fullUrl, options);
      if (!response.ok) throw new Error('Error al descargar PDF');

      const blob = await response.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64data = reader.result.split(',')[1];
          const file = new FileSystem.File(FileSystem.Paths.document, filename);
          file.write(base64data, { encoding: 'base64' });
          setFileUri(file.uri);
        } catch (err) {
          Alert.alert('Error', 'No se pudo guardar el PDF.');
        } finally {
          setLoading(false);
        }
      };
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Error al descargar PDF');
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!fileUri) return;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Compartir', 'La opción de compartir no está disponible en este dispositivo.');
    }
  };

  let WebViewComponent = null;
  if (webViewAvailable) {
    try {
      // require at render time to avoid crashing if module not installed
      // eslint-disable-next-line global-require
      WebViewComponent = require('react-native-webview').WebView;
    } catch (e) {
      WebViewComponent = null;
    }
  }

  // Try to load native PDF renderer if installed
  let PdfComponent = null;
  try {
    // eslint-disable-next-line global-require
    const maybe = require('react-native-pdf');
    PdfComponent = maybe && (maybe.default || maybe);
  } catch (e) {
    PdfComponent = null;
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{filename}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
          <Share2 size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={s.container}>
        {loading && (
          <View style={s.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 12 }}>Descargando PDF…</Text>
          </View>
        )}

        {!loading && fileUri && PdfComponent && (
          <PdfComponent
            source={{ uri: fileUri }}
            style={{ flex: 1, width: Dimensions.get('window').width }}
            trustAllCerts={false}
          />
        )}

        {!loading && fileUri && !PdfComponent && WebViewComponent && (
          <WebViewComponent
            originWhitelist={["*"]}
            source={{ uri: fileUri }}
            style={{ flex: 1 }}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            startInLoadingState
          />
        )}

        {!loading && fileUri && !PdfComponent && !WebViewComponent && (
          <View style={s.center}>
            <Text>No se puede previsualizar dentro de la app porque faltan paquetes nativos (react-native-pdf o react-native-webview).</Text>
            <TouchableOpacity style={[s.btn, { marginTop: 12 }]} onPress={handleShare}>
              <Text style={s.btnText}>Abrir PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  backBtn: { padding: 6 },
  shareBtn: { padding: 6 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  btn: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' }
});

export default PDFViewerScreen;
