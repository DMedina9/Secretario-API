import React, { useState } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Common/Loading';

const Irregulares = () => {
    const { showToast } = useToast();

    const [filterMes, setFilterMes] = useState(dayjs().subtract(1, 'month').format('YYYY-MM'));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const loadIrregulares = async () => {
        if (!filterMes || !/^\d{4}-\d{2}$/.test(filterMes)) {
            showToast('Selecciona un mes válido', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await apiRequest(`/informe/irregulares/${filterMes}-01`);
            setData(response.data || []);
        } catch (error) {
            console.error(error);
            showToast('Error al cargar publicadores irregulares', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setFilterMes(dayjs().subtract(1, 'month').format('YYYY-MM'));
        setData([]);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Irregulares</h1>
                <p className="page-description">Reporte de publicadores con meses sin predicar en los últimos 6 meses</p>
            </div>

            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Filtros</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="form-label">Mes Final (YYYY-MM)</label>
                            <input
                                type="month"
                                className="form-input"
                                value={filterMes}
                                onChange={(e) => setFilterMes(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-sm mt-md">
                        <button className="btn btn-secondary" onClick={clear}>Limpiar</button>
                        <button className="btn btn-primary" onClick={loadIrregulares}>Buscar</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Publicadores Irregulares</h3>
                </div>
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {data.length === 0 ? (
                                <p className="text-center text-muted">No se encontraron resultados.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Publicador</th>
                                            <th>Inicio</th>
                                            <th>Meses objetivo</th>
                                            <th>Predicó</th>
                                            <th>Faltantes</th>
                                            <th>Seg. sin predicar</th>
                                            <th>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.publicador}</td>
                                                <td>{item.inicio_predicacion ? dayjs(item.inicio_predicacion).format('MMM YYYY') : '-'}</td>
                                                <td>{item.meses_a_predicar}</td>
                                                <td>{item.meses_predicados}</td>
                                                <td>{item.meses_faltantes}</td>
                                                <td>{item.consecutivos_sin_predicar}</td>
                                                <td>{item.detalle_meses ? item.detalle_meses.map(m => `${m.mes} (${m.predico ? '✓' : '✗'})`).join(', ') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Irregulares;
