import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../../utils/api';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import Loading from '../Common/Loading';
import { useToast } from '../../contexts/ToastContext';

const ReporteS1 = () => {
    const { mesInforme } = useAnioServicio();
    // Default to current global reporting month if available, else current real month
    const [month, setMonth] = useState(mesInforme ? mesInforme.format('YYYY-MM') : dayjs().format('YYYY-MM'));
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    // Auto-load on mount is not in original code (user must click button), but it's nicer UI to load if we have a default.
    // However, if calculating S-1 is expensive, we might wait.
    // Original code: `document.getElementById('loadS1Btn').addEventListener...`
    // Let's stick to "Load" button pattern for heavy reports, or useEffect with dependencies if lightweight.
    // I'll add a useEffect to load initially if we are confident.
    // For now, I'll keep the button to be safe and consistent with original UX.

    const loadReport = async () => {
        if (!month) {
            showToast('Selecciona un mes', 'warning');
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest(`/secretario/s1/${month}-01`);
            if (data && data.success && data.data) {
                setReportData(data.data);
            } else {
                showToast('No se pudieron cargar los datos', 'error');
                setReportData([]);
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
                <h3 className="card-title">Reporte S-1: Estadísticas Mensuales</h3>
                <p className="card-subtitle">Estadísticas de la congregación para un mes específico</p>
            </div>
            <div className="card-body">
                <div className="flex items-end gap-md mb-lg">
                    <div className="form-group flex-1" style={{ maxWidth: '300px' }}>
                        <label className="form-label">Mes</label>
                        <input
                            type="month"
                            className="form-input"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={loadReport} disabled={loading}>
                        {loading ? 'Generando...' : 'Generar Reporte S-1'}
                    </button>
                </div>

                {loading && <Loading />}

                {reportData && (
                    <div className="grid grid-cols-1 gap-lg mt-lg">
                        {reportData.map((section, index) => (
                            <div key={index} className="card bg-tertiary">
                                <div className="card-header">
                                    <h4 className="font-bold text-lg">{section.titulo}</h4>
                                </div>
                                <div className="card-body">
                                    {section.subsecciones && section.subsecciones.map((sub, idx) => (
                                        <div key={idx} className="mb-md">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">{sub.label}:</span>
                                                <span className="font-mono bg-primary-dark px-2 py-1 rounded">
                                                    {sub.valor !== undefined && sub.valor !== null ? Math.round(sub.valor * 100) / 100 : 'N/A'}
                                                </span>
                                            </div>
                                            {sub.descripcion && (
                                                <p className="text-muted text-sm mt-xs">{sub.descripcion}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReporteS1;
