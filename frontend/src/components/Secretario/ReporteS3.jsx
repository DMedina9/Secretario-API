import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import Loading from '../Common/Loading';
import { useToast } from '../../contexts/ToastContext';

const ReporteS3 = () => {
    const { anioServicio } = useAnioServicio();
    const [year, setYear] = useState(anioServicio);
    const [type, setType] = useState('ES');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const loadReport = async () => {
        if (!year) {
            showToast('Ingresa un año', 'warning');
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest(`/secretario/s3/${year}/${type}`);
            if (data && data.success && data.data) {
                setReportData(data.data);
            } else {
                setReportData([]); // Empty array meant no data found
                showToast('No hay datos para esta selección', 'info');
            }
        } catch (error) {
            showToast('Error al cargar reporte', 'error');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Reporte S-3: Asistencia Anual</h3>
                <p className="card-subtitle">Registro de asistencia por semanas del año de servicio</p>
            </div>
            <div className="card-body">
                <div className="flex items-end gap-md mb-lg flex-wrap">
                    <div className="form-group" style={{ width: '150px' }}>
                        <label className="form-label">Año de Servicio</label>
                        <input
                            type="number"
                            className="form-input"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '200px' }}>
                        <label className="form-label">Tipo</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="ES">Entre Semana</option>
                            <option value="FS">Fin de Semana</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ width: '200px' }}>
                        <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
                            Generar Reporte
                        </button>
                    </div>
                </div>

                {loading && <Loading />}

                {reportData && reportData.length > 0 && (
                    <div className="card bg-tertiary mt-lg">
                        <div className="card-header">
                            <h4>{type === 'ES' ? 'Entre Semana' : 'Fin de Semana'} - Año {year}</h4>
                        </div>
                        <div className="card-body overflow-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Año</th>
                                        <th>Semana 1</th>
                                        <th>Semana 2</th>
                                        <th>Semana 3</th>
                                        <th>Semana 4</th>
                                        <th>Semana 5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) => (
                                        <tr key={index}>
                                            <td data-label="Mes">{row.month}</td>
                                            <td data-label="Año">{row.year}</td>
                                            <td data-label="Semana 1">{row.semana_1 || '-'}</td>
                                            <td data-label="Semana 2">{row.semana_2 || '-'}</td>
                                            <td data-label="Semana 3">{row.semana_3 || '-'}</td>
                                            <td data-label="Semana 4">{row.semana_4 || '-'}</td>
                                            <td data-label="Semana 5">{row.semana_5 || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {reportData && reportData.length === 0 && !loading && (
                    <div className="alert alert-info mt-lg">No se encontraron datos para los filtros seleccionados.</div>
                )}
            </div>
        </div>
    );
};

export default ReporteS3;
