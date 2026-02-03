import React, { useState } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const ReportesS21 = () => {
    const { getAuthHeaders } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/fillpdf/get-s21`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ anio: null }) // null means ALL
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al descargar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `S21_Por_Publicador.zip`; // The API returns a ZIP probably if multiple? Or concatenated PDF? The endpoint /get-s21 with no publicador sends a zip?
            // Original code: downloadFile('/fillpdf/get-s21', { anio: null }, 'S21_Por_Publicador.zip');
            // So it expects a zip.
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Archivo generado y descargado', 'success');
        } catch (error) {
            showToast('Error al descargar: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Descargar S-21</h3>
                <p className="card-subtitle">Descargar todos los informes S-21</p>
            </div>
            <div className="card-body">
                <button className="btn btn-secondary" onClick={handleDownload} disabled={loading}>
                    {loading ? 'Generando...' : 'Descargar todos los S-21'}
                </button>
            </div>
        </div>
    );
};

export default ReportesS21;
