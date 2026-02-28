import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import Loading from '../Common/Loading';
import { useToast } from '../../contexts/ToastContext';

const ReporteS10 = () => {
    const { anioServicio } = useAnioServicio();
    const [year, setYear] = useState(anioServicio);
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
            const data = await apiRequest(`/secretario/s10/${year}`);
            if (data && data.success && data.data) {
                setReportData(data.data);
            } else {
                showToast('No se pudieron cargar los datos', 'error');
                setReportData(null);
            }
        } catch (error) {
            showToast('Error al cargar reporte', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Reporte S-10: Análisis de la Congregación</h3>
                <p className="card-subtitle">Estadísticas anuales de la congregación por año de servicio</p>
            </div>
            <div className="card-body">
                <div className="flex items-end gap-md mb-lg">
                    <div className="form-group" style={{ width: '150px' }}>
                        <label className="form-label">Año de Servicio</label>
                        <input
                            type="number"
                            className="form-input"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '150px' }}>
                        <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
                            Generar Reporte S-10
                        </button>
                    </div>
                </div>

                {loading && <Loading />}

                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-lg">

                        {/* Asistencia */}
                        <div className="card bg-tertiary">
                            <div className="card-header">
                                <h4>Promedio de Asistencia a las Reuniones</h4>
                            </div>
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-md border-b border-light pb-sm">
                                    <span>Reunión del fin de semana</span>
                                    <span className="font-bold text-lg">{reportData.asistencia.fin_de_semana}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Reunión de entre semana</span>
                                    <span className="font-bold text-lg">{reportData.asistencia.entre_semana}</span>
                                </div>
                            </div>
                        </div>

                        {/* Territorios */}
                        <div className="card bg-tertiary">
                            <div className="card-header">
                                <h4>Territorios Abarcados</h4>
                            </div>
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-md border-b border-light pb-sm">
                                    <span>Número total de territorios</span>
                                    <span className="font-bold text-lg">{reportData.territorios.total}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Territorios no predicados</span>
                                    <span className="font-bold text-lg">{reportData.territorios.no_predicados}</span>
                                </div>
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="card bg-tertiary md:col-span-2">
                            <div className="card-header">
                                <h4>Totales de la Congregación</h4>
                            </div>
                            <div className="card-body grid grid-cols-2 gap-lg">
                                <div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Todos los publicadores activos:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.publicadores_activos}</span>
                                    </div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Nuevos publicadores inactivos:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.nuevos_inactivos}</span>
                                    </div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Publicadores reactivados:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.reactivados}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Publicadores sordos:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.sordos}</span>
                                    </div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Publicadores ciegos:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.ciegos}</span>
                                    </div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Publicadores encarcelados:</span>
                                        <span className="font-bold">{reportData.totales_congregacion.encarcelados}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default ReporteS10;
