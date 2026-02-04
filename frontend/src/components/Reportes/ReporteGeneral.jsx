import React, { useState } from 'react';
import { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';

const ReporteGeneral = () => {
    const { getAuthHeaders } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/secretario/export/template`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al descargar reporte');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Extract filename
            let filename = `Reporte_General_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1].replace(/"/g, '');
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Reporte descargado', 'success');
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">📊 Reporte General</h3>
                <p className="card-subtitle">Descarga el reporte completo en Excel con datos del sistema</p>
            </div>
            <div className="card-body">
                <p className="mb-md text-secondary">
                    Este reporte descarga un archivo Excel con toda la información de la congregación, incluyendo publicadores, informes, y estadísticas de servicio.
                </p>
                <button
                    className="btn btn-success"
                    onClick={handleDownload}
                    disabled={loading}
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
                >
                    {loading ? 'Descargando...' : '📑 Descargar Reporte Completo (.xlsx)'}
                </button>
                {loading && <Loading />}
            </div>
        </div>
    );
};

export default ReporteGeneral;
