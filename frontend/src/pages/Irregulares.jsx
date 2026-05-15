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
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

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
        setFilterStatus('Todos');
        setData([]);
    };

    const totals = data.reduce((acc, item) => {
        if (item.meses_predicados > 0) acc.irregulares++;
        else acc.inactivos++;
        return acc;
    }, { irregulares: 0, inactivos: 0 });

    const filteredData = data.filter(item => {
        if (filterStatus === 'Todos') return true;
        const isIrregular = item.meses_predicados > 0;
        return filterStatus === 'Irregular' ? isIrregular : !isIrregular;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'nombre') {
            valA = `${a.apellidos} ${a.nombre}`.toLowerCase();
            valB = `${b.apellidos} ${b.nombre}`.toLowerCase();
        } else if (sortConfig.key === 'grupo') {
            valA = a.grupo ? a.grupo.toString() : '';
            valB = b.grupo ? b.grupo.toString() : '';
        } else if (sortConfig.key === 'estatus') {
            valA = a.meses_predicados > 0 ? 1 : 0;
            valB = b.meses_predicados > 0 ? 1 : 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            <div className="form-group">
                                <label className="form-label">Mes</label>
                                <input
                                    type="month"
                                    className="form-input"
                                    value={filterMes}
                                    onChange={(e) => setFilterMes(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estatus</label>
                                <select 
                                    className="form-select"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                >
                                    <option value="Todos">Todos</option>
                                    <option value="Irregular">Irregular</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-sm">
                            <button className="btn btn-secondary" onClick={clear}>Limpiar</button>
                            <button className="btn btn-primary" onClick={loadIrregulares}>Buscar</button>
                        </div>
                    </div>
                </div>

                {data.length > 0 && (
                    <div className="card overflow-hidden">
                        <div className="card-header flex justify-between items-center">
                            <h3 className="card-title">Publicadores Irregulares e Inactivos: {dayjs(filterMes + '-01').format('MMMM YYYY')}</h3>
                            <button className="btn btn-secondary btn-sm no-print" onClick={() => window.print()}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                    <rect x="6" y="14" width="12" height="8"></rect>
                                </svg>
                                Imprimir
                            </button>
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
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {filteredData.length === 0 ? (
                                <p className="text-center text-muted">No se encontraron resultados.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }} title="Ordenar por Nombre">
                                                Publicador {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <span className="no-print">↑</span> : <span className="no-print">↓</span>)}
                                            </th>
                                            <th onClick={() => handleSort('grupo')} style={{ cursor: 'pointer' }} title="Ordenar por Grupo">
                                                Grupo {sortConfig.key === 'grupo' && (sortConfig.direction === 'asc' ? <span className="no-print">↑</span> : <span className="no-print">↓</span>)}
                                            </th>
                                            <th onClick={() => handleSort('estatus')} style={{ cursor: 'pointer' }} title="Ordenar por Estado">
                                                Estado {sortConfig.key === 'estatus' && (sortConfig.direction === 'asc' ? <span className="no-print">↑</span> : <span className="no-print">↓</span>)}
                                            </th>
                                            <th className="no-print">Meses objetivo</th>
                                            <th className="no-print">Predicó</th>
                                            <th className="no-print">Consecutivos sin predicar</th>
                                            <th>Tendencia (6 meses)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedData.map((item) => (
                                            <tr key={item.id}>
                                                <td data-label="Publicador">
                                                    <div style={{ fontWeight: 'bold' }}>{item.apellidos}, {item.nombre}</div>
                                                    <div className="flex gap-md" style={{ fontSize: '0.8rem' }}>
                                                        <div>
                                                            <span className="font-bold">Último informe:</span> {item.fin_predicacion ? dayjs(item.fin_predicacion).format('MMM YYYY') : '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Grupo">
                                                    {item.grupo}
                                                </td>
                                                <td data-label="Estado">
                                                    <span className={`badge ${item.meses_predicados > 0 ? 'badge-warning' : 'badge-error'}`}>
                                                        {item.meses_predicados > 0 ? 'Irregular' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td data-label="Objetivo" className="no-print">{item.meses_a_predicar}</td>
                                                <td data-label="Predicó" className="no-print">{item.meses_predicados}</td>
                                                <td data-label="Sin predicar" className="no-print text-center">
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
