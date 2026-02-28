import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';
import { useAuth } from '../../contexts/AuthContext';

const TerritoriosConfig = ({ onKmlUploaded }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [total, setTotal] = useState('');
    const [noPredicados, setNoPredicados] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const [totalRes, noPredRes] = await Promise.all([
                apiRequest('/configuraciones/total_territorios'),
                apiRequest('/configuraciones/territorios_no_predicados')
            ]);

            if (totalRes?.data) setTotal(totalRes.data.valor);
            if (noPredRes?.data) setNoPredicados(noPredRes.data.valor);

        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveConfig = async () => {
        if (!total || !noPredicados) {
            showToast('Completa todos los campos', 'warning');
            return;
        }

        setLoading(true);
        try {
            await Promise.all([
                apiRequest('/configuraciones/total_territorios', {
                    method: 'PUT',
                    body: { valor: total }
                }),
                apiRequest('/configuraciones/territorios_no_predicados', {
                    method: 'PUT',
                    body: { valor: noPredicados }
                })
            ]);
            showToast('Configuración guardada', 'success');
        } catch (error) {
            showToast('Error al guardar', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleKmlUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('kml', file);

            const result = await apiRequest('/territorios/upload', {
                method: 'POST',
                body: formData
            });

            if (result && result.success) {
                showToast('KML subido exitosamente', 'success');
                onKmlUploaded(); // Trigger map reload
            } else {
                showToast(result.error || 'Error al subir KML', 'error');
            }
        } catch (error) {
            showToast('Error al subir archivo', 'error');
        } finally {
            setLoading(false);
            e.target.value = null; // Reset input
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Configuration Card */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Configuración</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-md mb-md">
                        <div className="form-group">
                            <label className="form-label">Total Territorios</label>
                            {isAdmin ? <input
                                type="number"
                                className="form-input"
                                value={total}
                                onChange={(e) => setTotal(e.target.value)}
                                min="0"
                            /> : <p className="form-input">{total}</p>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">No Predicados</label>
                            {isAdmin ? <input
                                type="number"
                                className="form-input"
                                value={noPredicados}
                                onChange={(e) => setNoPredicados(e.target.value)}
                                min="0"
                            /> : <p className="form-input">{noPredicados}</p>}
                        </div>
                    </div>
                    {isAdmin && <button className="btn btn-primary" onClick={handleSaveConfig} disabled={loading}>
                        Guardar Configuración
                    </button>}
                </div>
            </div>

            {/* KML Upload Card */}
            {isAdmin && <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Subir archivo KML</h3>
                    <p className="card-subtitle">Actualiza los límites de los territorios</p>
                </div>
                <div className="card-body">
                    <div className="form-group">
                        <label className="btn btn-primary cursor-pointer inline-block">
                            <span>📤 Subir KML</span>
                            <input
                                type="file"
                                accept=".kml"
                                onChange={handleKmlUpload}
                                style={{ display: 'none' }}
                                disabled={loading}
                            />
                        </label>
                    </div>
                    {loading && <Loading />}
                </div>
            </div>}
        </div>
    );
};

export default TerritoriosConfig;
