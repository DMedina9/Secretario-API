import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';

const ConfigSettings = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        try {
            const result = await apiRequest('/configuraciones/');
            if (result && result.success && result.data) {
                setConfigs(result.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar configuraciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (clave, value) => {
        setConfigs(prev => prev.map(c => c.clave === clave ? { ...c, valor: value } : c));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedConfigs = configs.map(c => ({ clave: c.clave, valor: c.valor }));
            const result = await apiRequest('/configuraciones/bulk', {
                method: 'PUT',
                body: { configuraciones: updatedConfigs }
            });

            if (result && result.success) {
                showToast('Configuraciones guardadas', 'success');
            } else {
                showToast(result.error || 'Error al guardar', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && configs.length === 0) return <Loading />;

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Configuraciones del Sistema</h3>
                <p className="card-subtitle">Edita los valores de configuración</p>
            </div>
            <div className="card-body">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Clave</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {configs.map(config => (
                                <tr key={config.clave}>
                                    <td data-label="Clave" className="font-bold">{config.clave.replace(/_/g, ' ')}</td>
                                    <td data-label="Valor">
                                        <input
                                            type={config.tipo || 'text'}
                                            className="form-input"
                                            value={config.valor || ''}
                                            onChange={(e) => handleInputChange(config.clave, e.target.value)}
                                            style={{ maxWidth: '400px' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {configs.length === 0 && (
                                <tr>
                                    <td colSpan="2" className="text-center text-muted">No hay configuraciones</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <button className="btn btn-primary mt-md" onClick={handleSave} disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Configuraciones'}
                </button>
            </div>
        </div>
    );
};

export default ConfigSettings;
