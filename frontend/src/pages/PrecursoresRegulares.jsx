import React, { useState } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../utils/api';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Common/Loading';

const MonthlyBarChart = ({ item }) => {
    const months = [
        { key: 'sep', label: 'Sep' },
        { key: 'oct', label: 'Oct' },
        { key: 'nov', label: 'Nov' },
        { key: 'dic', label: 'Dic' },
        { key: 'ene', label: 'Ene' },
        { key: 'feb', label: 'Feb' },
        { key: 'mar', label: 'Mar' },
        { key: 'abr', label: 'Abr' },
        { key: 'may', label: 'May' },
        { key: 'jun', label: 'Jun' },
        { key: 'jul', label: 'Jul' },
        { key: 'ago', label: 'Ago' },
    ];

    return (
        <div className="monthly-bar-chart">
            {months.map((m) => {
                const value = item[m.key];
                if (value === undefined || value === null) return null;

                const numValue = parseFloat(value) || 0;
                const barWidth = Math.min((numValue / 90) * 100, 100) + '%';
                const barColorClass = numValue < 45 ? 'bg-danger' : numValue < 50 ? 'bg-warning' : 'bg-success';

                return (
                    <div key={m.key} className="chart-row">
                        <span className="chart-label">{m.label}</span>
                        <div className="bar-wrapper">
                            <div className="bar-background">
                                <div className={`bar ${barColorClass}`} style={{ width: barWidth }} />
                            </div>
                            <span className="bar-value">{numValue}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const PrecursoresRegulares = () => {
    const { anioServicio } = useAnioServicio();
    const { showToast } = useToast();

    const [filterAnio, setFilterAnio] = useState(anioServicio || dayjs().year());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const loadPrecursores = async () => {
        if (!filterAnio) {
            showToast('Seleccione un año de servicio', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await apiRequest(`/informe/precursoresRegulares/${filterAnio}`);
            if (response && response.data) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar precursores regulares', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setFilterAnio(anioServicio || dayjs().year());
        setData([]);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Precursores Regulares</h1>
                <p className="page-description">Reporte de precursores regulares</p>
            </div>

            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Filtros</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="form-label">Año de Servicio</label>
                            <input
                                type="number"
                                className="form-input"
                                value={filterAnio}
                                onChange={(e) => setFilterAnio(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-sm mt-md">
                        <button className="btn btn-secondary" onClick={clear}>Limpiar</button>
                        <button className="btn btn-primary" onClick={loadPrecursores}>Buscar</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Reporte de Precursores Regulares {filterAnio}</h3>
                </div>
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {data.length === 0 ? (
                                <p className="text-center text-muted">No hay datos. Aplica filtros y busca.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Inicio</th>
                                            <th>Años/Meses</th>
                                            <th>Suma</th>
                                            <th>Promedio</th>
                                            <th>Desempeño Anual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={`${item.id}-${item.publicador}`}>
                                                <td data-label="Nombre">
                                                    <div style={{ fontWeight: 'bold' }}>{item.publicador}</div>
                                                </td>
                                                <td data-label="Inicio">
                                                    {item.inicio_precursorado ? dayjs(item.inicio_precursorado).format('MMM YYYY') : '-'}
                                                </td>
                                                <td data-label="Años/Meses">
                                                    <div>{item.anios_precursorado ?? 0} años</div>
                                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{item.meses ?? 0} meses</div>
                                                </td>
                                                <td data-label="Suma">{item.suma}</td>
                                                <td data-label="Promedio">
                                                    <span className={`badge ${item.promedio < 45 ? 'badge-danger' : item.promedio < 50 ? 'badge-warning' : 'badge-success'}`}>
                                                        {item.promedio.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td data-label="Desempeño">
                                                    <MonthlyBarChart item={item} />
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


export default PrecursoresRegulares;
