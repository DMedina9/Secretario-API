import React, { useState } from 'react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import Loading from '../Common/Loading';

const Maintenance = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Dialog states
    const [confirmAction, setConfirmAction] = useState(null); // 'asistencias' | 'informes'
    const [showConfirm, setShowConfirm] = useState(false);
    const [showFinalConfirm, setShowFinalConfirm] = useState(false); // Second confirmation level

    const handleCleanup = (type) => {
        setConfirmAction(type);
        setShowConfirm(true);
    };

    const performCleanup = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (confirmAction === 'asistencias') endpoint = '/asistencias/maintenance/old';
            if (confirmAction === 'informes') endpoint = '/informe/maintenance/old';

            const result = await apiRequest(endpoint, { method: 'DELETE' });

            if (result && result.success) {
                showToast(`Registros eliminados: ${result.deleted}`, 'success');
            } else {
                showToast(result.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            showToast('Error al ejecutar mantenimiento', 'error');
        } finally {
            setLoading(false);
            setConfirmAction(null);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Mantenimiento de la Base de Datos</h3>
                <p className="card-subtitle">Eliminar registros antiguos para optimizar el sistema</p>
            </div>
            <div className="card-body">
                {loading && <Loading />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div>
                        <h4 className="font-bold mb-xs">Limpiar Asistencias</h4>
                        <p className="text-muted text-sm mb-md">Eliminar registros de asistencias de hace 2 años o más desde la fecha actual</p>
                        <button
                            className="btn btn-warning"
                            onClick={() => handleCleanup('asistencias')}
                            disabled={loading}
                        >
                            🗑️ Limpiar Asistencias Antiguas
                        </button>
                    </div>
                    <div>
                        <h4 className="font-bold mb-xs">Limpiar Informes</h4>
                        <p className="text-muted text-sm mb-md">Eliminar informes de hace 2 años o más desde el último informe de cada publicador</p>
                        <button
                            className="btn btn-warning"
                            onClick={() => handleCleanup('informes')}
                            disabled={loading}
                        >
                            🗑️ Limpiar Informes Antiguos
                        </button>
                    </div>
                </div>
            </div>

            {/* First Confirmation */}
            <ConfirmDialog
                isOpen={showConfirm}
                title="⚠️ Confirmación de Mantenimiento"
                message={confirmAction === 'asistencias'
                    ? "¿Estás seguro de que deseas eliminar todas las asistencias de hace 2 años o más? Esta acción NO se puede deshacer."
                    : "¿Estás seguro de que deseas eliminar los informes antiguos? Esta acción NO se puede deshacer."
                }
                onConfirm={() => { setShowConfirm(false); setShowFinalConfirm(true); }}
                onCancel={() => { setShowConfirm(false); setConfirmAction(null); }}
            />

            {/* Final Confirmation */}
            <ConfirmDialog
                isOpen={showFinalConfirm}
                title="⚠️ CONFIRMACIÓN FINAL"
                message="Se eliminarán PERMANENTEMENTE los registros antiguos. ¿Estás absolutamente seguro?"
                onConfirm={() => { setShowFinalConfirm(false); performCleanup(); }}
                onCancel={() => { setShowFinalConfirm(false); setConfirmAction(null); }}
            />
        </div>
    );
};

export default Maintenance;
