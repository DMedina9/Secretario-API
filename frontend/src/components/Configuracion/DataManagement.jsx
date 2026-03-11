import React, { useState, useEffect } from 'react';
import { apiRequest, API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';
import { io as ioClient } from 'socket.io-client';

const DataManagement = () => {
    const { getAuthHeaders } = useAuth(); // Need auth headers for manual fetch/download
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedTable, setSelectedTable] = useState('publicador'); // publicador, informe, asistencias
    const [restoreFile, setRestoreFile] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        const socket = ioClient(API_BASE_URL, { withCredentials: true });
        socket.on('connect', () => {});
        socket.on('backup', (data) => {
            if (data.status === 'restore_started') {
                setIsRestoring(true);
                showToast('Restauración iniciada', 'info');
            }
            if (data.status === 'restore_success') {
                setIsRestoring(false);
                showToast('Restauración completada', 'success');
            }
            if (data.status === 'restore_error') {
                setIsRestoring(false);
                showToast('Error al restaurar: ' + (data.error || ''), 'error');
            }
        });

        return () => socket.disconnect();
    }, []);

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

    const handleDownloadBackup = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/backup/download`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al descargar respaldo');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString()}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Respaldo descargado', 'success');
        } catch (error) {
            showToast('Error al descargar respaldo: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreBackup = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRestoreFile(file);
        setShowRestoreConfirm(true);
        e.target.value = null;
    };

    const performRestore = async () => {
        if (!restoreFile) return;
        setShowRestoreConfirm(false);
        setLoading(true);
        const formData = new FormData();
        formData.append('backup', restoreFile);
        try {
            const response = await fetch(`${API_BASE_URL}/backup/restore`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            const data = await response.json();
            if (data && data.success) {
                showToast('Restauración completada correctamente', 'success');
            } else {
                showToast('Error al restaurar: ' + (data.error || 'respuesta inesperada'), 'error');
            }
        } catch (error) {
            showToast('Error al restaurar: ' + error.message, 'error');
        } finally {
            setLoading(false);
            setRestoreFile(null);
        }
    };

    const cancelRestore = () => {
        setShowRestoreConfirm(false);
        setRestoreFile(null);
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Gestión de Datos</h3>
                <p className="card-subtitle">Importar y Exportar información del sistema</p>
            </div>
            <div className="card-body">
                {loading && <Loading />}
                {isRestoring && (
                    <>
                        <div className="mb-md p-sm bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                            <strong>Restauración en progreso:</strong> La base de datos está siendo restaurada. Algunas operaciones pueden verse afectadas.
                        </div>
                        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                            <div className="bg-white p-4 rounded shadow">
                                <strong>Restauración en progreso</strong>
                                <p className="text-sm">La base de datos está siendo restaurada. Por favor espera a que termine.</p>
                            </div>
                        </div>
                    </>
                )}
                {showRestoreConfirm && (
                    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/3">
                            <h3 className="font-bold mb-2">Confirmar restauración</h3>
                            <p className="mb-4">La restauración reemplazará completamente la base de datos del servidor. ¿Deseas continuar?</p>
                            <div className="flex justify-end gap-sm">
                                <button className="btn" onClick={cancelRestore}>Cancelar</button>
                                <button className="btn btn-danger" onClick={performRestore}>Restaurar</button>
                            </div>
                        </div>
                    </div>
                )}
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
                                    disabled={loading || isRestoring}
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
                                    disabled={loading || isRestoring}
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
                                    disabled={loading || isRestoring}
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
                                disabled={loading || isRestoring}
                            />
                        </label>
                    </div>

                    <div>
                        <h4 className="font-bold mb-sm">Exportar</h4>
                        <p className="text-muted text-sm mb-sm">Descargar datos actuales</p>
                        <div className="flex gap-sm flex-wrap">
                            <button className="btn btn-secondary" onClick={() => handleExport('excel')} disabled={loading || isRestoring}>Excel</button>
                            <button className="btn btn-secondary" onClick={() => handleExport('json')} disabled={loading || isRestoring}>JSON</button>
                            <button className="btn btn-secondary" onClick={() => handleExport('xml')} disabled={loading || isRestoring}>XML</button>
                        </div>
                    </div>
                
                    <div>
                        <h4 className="font-bold mb-sm">Respaldo de Base</h4>
                        <p className="text-muted text-sm mb-sm">Descargar o restaurar la base de datos completa</p>
                        <div className="flex gap-sm flex-wrap">
                            <button className="btn btn-secondary" onClick={handleDownloadBackup} disabled={loading || isRestoring}>Descargar respaldo</button>
                            <label className="btn btn-secondary cursor-pointer inline-block">
                                <span>Restaurar</span>
                                <input
                                    type="file"
                                    accept=".db"
                                    onChange={handleRestoreBackup}
                                    style={{ display: 'none' }}
                                    disabled={loading || isRestoring}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;
