import React, { useState } from 'react';
import { apiRequest, API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';

const DataManagement = () => {
    const { getAuthHeaders } = useAuth(); // Need auth headers for manual fetch/download
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedTable, setSelectedTable] = useState('publicador'); // publicador, informe, asistencias

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = `/${selectedTable}/import`;
            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: formData
            });

            if (data && (data.success || data.message)) {
                showToast('Importación completada con éxito', 'success');
            } else {
                showToast('Error en la importación', 'error');
            }
        } catch (error) {
            showToast('Error al importar: ' + error.message, 'error');
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    const handleExport = async (format) => {
        setLoading(true);
        try {
            const endpoint = `/${selectedTable}/export?format=${format}`;
            const extension = format === 'excel' ? 'xlsx' : format;

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al descargar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedTable}_export.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Exportación completada', 'success');
        } catch (error) {
            showToast('Error al exportar: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Gestión de Datos</h3>
                <p className="card-subtitle">Importar y Exportar información del sistema</p>
            </div>
            <div className="card-body">
                {loading && <Loading />}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mt-md">
                    <div>
                        <h4 className="font-bold mb-sm">Tablas</h4>
                        <div className="flex flex-col gap-sm">
                            <label className="flex items-center gap-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="dataTable"
                                    value="publicador"
                                    checked={selectedTable === 'publicador'}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                />
                                Publicadores
                            </label>
                            <label className="flex items-center gap-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="dataTable"
                                    value="informe"
                                    checked={selectedTable === 'informe'}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                />
                                Informes
                            </label>
                            <label className="flex items-center gap-sm cursor-pointer">
                                <input
                                    type="radio"
                                    name="dataTable"
                                    value="asistencias"
                                    checked={selectedTable === 'asistencias'}
                                    onChange={(e) => setSelectedTable(e.target.value)}
                                />
                                Asistencias
                            </label>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-sm">Importar</h4>
                        <p className="text-muted text-sm mb-sm">Carga masiva desde Excel (.xlsx)</p>
                        <label className="btn btn-secondary cursor-pointer inline-block">
                            <span>Importar</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleImport}
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                        </label>
                    </div>

                    <div>
                        <h4 className="font-bold mb-sm">Exportar</h4>
                        <p className="text-muted text-sm mb-sm">Descargar datos actuales</p>
                        <div className="flex gap-sm flex-wrap">
                            <button className="btn btn-secondary" onClick={() => handleExport('excel')} disabled={loading}>Excel</button>
                            <button className="btn btn-secondary" onClick={() => handleExport('json')} disabled={loading}>JSON</button>
                            <button className="btn btn-secondary" onClick={() => handleExport('xml')} disabled={loading}>XML</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
