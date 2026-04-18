import React, { useState } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Common/Loading';

const IrregularityChart = ({ item }) => {
    if (!item.detalle_meses) return null;
    return (
        <div className="irregularity-chart">
            {item.detalle_meses.map((m, idx) => (
                <div key={idx} className="chart-month">
                    <div className={`chart-block ${m.predico ? 'bg-success' : 'bg-danger'}`} title={`${m.mes}: ${m.predico ? 'Predicó' : 'No predicó'}`} />
                    <span className="chart-month-label">{dayjs(m.mes + '-01').format('MMM')}</span>
                </div>
            ))}
        </div>
    );
};

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

    const totals = data.reduce((acc, item) => {
        if (item.meses_predicados > 0) acc.irregulares++;
        else acc.inactivos++;
        return acc;
    }, { irregulares: 0, inactivos: 0 });

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Irregulares</h1>
                <p className="page-description">Reporte de publicadores con meses sin predicar en los últimos 6 meses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-lg">
                <div className="card no-print">
                    <div className="card-header">
                        <h3 className="card-title">Filtros</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Mes</label>
                            <input
                                type="month"
                                className="form-input"
                                value={filterMes}
                                onChange={(e) => setFilterMes(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-sm">
                            <button className="btn btn-secondary" onClick={clear}>Limpiar</button>
                            <button className="btn btn-primary" onClick={loadIrregulares}>Buscar</button>
                        </div>
                    </div>
                </div>

                {data.length > 0 && (
                    <div className="card overflow-hidden">
                        <div className="card-header">
                            <h3 className="card-title">Resumen: {dayjs(filterMes + '-01').format('MMMM YYYY')}</h3>
                        </div>
                        <div className="card-body">
                            <div className="flex gap-md justify-around items-center h-full py-md">
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: 'var(--color-warning)' }}>{totals.irregulares}</div>
                                    <div className="text-sm text-muted">Irregulares</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold" style={{ color: 'var(--color-error)' }}>{totals.inactivos}</div>
                                    <div className="text-sm text-muted">Inactivos</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">{data.length}</div>
                                    <div className="text-sm text-muted">Total</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Publicadores Irregulares e Inactivos</h3>
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
                                            <th>Estado</th>
                                            <th>Meses objetivo</th>
                                            <th>Predicó</th>
                                            <th>Consecutivos sin predicar</th>
                                            <th>Tendencia (6 meses)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={item.id}>
                                                <td data-label="Publicador">
                                                    <div style={{ fontWeight: 'bold' }}>{item.apellidos}, {item.nombre}</div>
                                                    <div className="flex gap-md" style={{ fontSize: '0.8rem' }}>
                                                        <div>
                                                            <span className="font-bold">Grupo:</span> {item.grupo}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold">Último informe:</span> {item.fin_predicacion ? dayjs(item.fin_predicacion).format('MMM YYYY') : '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Estado">
                                                    <span className={`badge ${item.meses_predicados > 0 ? 'badge-warning' : 'badge-error'}`}>
                                                        {item.meses_predicados > 0 ? 'Irregular' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td data-label="Objetivo">{item.meses_a_predicar}</td>
                                                <td data-label="Predicó">{item.meses_predicados}</td>
                                                <td data-label="Sin predicar" className="text-center">
                                                    <span style={{ fontWeight: 'bold', color: item.consecutivos_sin_predicar >= 3 ? 'var(--color-error)' : item.consecutivos_sin_predicar >= 1 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                                        {item.consecutivos_sin_predicar}
                                                    </span>
                                                </td>
                                                <td data-label="Tendencia">
                                                    <IrregularityChart item={item} />
                                                </td>
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
