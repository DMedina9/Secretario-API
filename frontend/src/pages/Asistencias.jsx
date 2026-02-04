import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiRequest } from '../utils/api';
import Calendar from '../components/Asistencias/Calendar';
import AsistenciaForm from '../components/Asistencias/AsistenciaForm';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import Loading from '../components/Common/Loading';

const Asistencias = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAsistencia, setSelectedAsistencia] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadAsistencias();
    }, [currentDate]); // Reload when month changes? Actually API call in original code loads ALL.
    // Optimization: If original code loaded ALL, we can just load once.
    // But let's stick to simple react pattern: load on mount.
    // If the list is huge, we should filter by server, but for now we follow original approach.

    useEffect(() => {
        // Initial load
        const init = async () => {
            await loadAsistencias();
        };
        init();
    }, []);

    const loadAsistencias = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/asistencias/all');
            if (data && data.data) {
                setAsistencias(data.data);
            } else {
                setAsistencias([]);
            }
        } catch (error) {
            showToast('Error al cargar asistencias', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data) => {
        if (!isAdmin) {
            showToast('No tienes permisos para registrar.', 'info');
            return;
        }

        try {
            setIsLoading(true);
            const result = await apiRequest('/asistencias/add', {
                method: 'POST',
                body: data
            });

            if (result && result.success) {
                showToast('Asistencia registrada', 'success');
                setIsFormOpen(false);
                loadAsistencias();
            }
        } catch (error) {
            showToast('Error al registrar asistencia', 'error');
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data) => {
        if (!isAdmin) {
            showToast('No tienes permisos para editar.', 'info');
            return;
        }

        try {
            setIsLoading(true);
            const result = await apiRequest(`/asistencias/${selectedAsistencia.id}`, {
                method: 'PUT',
                body: data
            });

            if (result && result.success) {
                showToast('Asistencia actualizada', 'success');
                setIsFormOpen(false);
                setSelectedAsistencia(null);
                loadAsistencias();
            }
        } catch (error) {
            showToast('Error al actualizar asistencia', 'error');
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAsistencia) return;
        if (!isAdmin) return;

        try {
            setIsLoading(true);
            const result = await apiRequest(`/asistencias/${selectedAsistencia.id}`, {
                method: 'DELETE'
            });

            if (result && result.success) {
                showToast('Asistencia eliminada', 'success');
                setIsFormOpen(false); // Close the form modal as well since we were editing
                loadAsistencias();
            }
        } catch (error) {
            showToast('Error al eliminar asistencia', 'error');
            setIsLoading(false);
        } finally {
            setIsDeleteConfirmOpen(false);
            setSelectedAsistencia(null);
        }
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => prev.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => prev.add(1, 'month'));
    };

    const handleSelectDate = (date) => {
        if (!isAdmin) {
            showToast('No tienes permisos para registrar.', 'info');
            return;
        }
        setSelectedAsistencia({ fecha: date.format('YYYY-MM-DD') });
        setIsFormOpen(true);
    };

    const handleSelectAsistencia = (asistencia) => {
        if (!isAdmin) {
            showToast('No tienes permisos para editar.', 'info');
            return;
        }
        setSelectedAsistencia(asistencia);
        setIsFormOpen(true);
    };

    const triggerDelete = () => {
        // We need to confirm from the form modal
        setIsDeleteConfirmOpen(true);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Asistencias</h1>
                <p className="page-description">Registro de asistencia a las reuniones</p>
            </div>

            <div className="card">
                <div className="card-body">
                    <Calendar
                        currentDate={currentDate}
                        asistencias={asistencias}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        onSelectDate={handleSelectDate}
                        onSelectAsistencia={handleSelectAsistencia}
                    />
                </div>
            </div>

            {isLoading && <Loading />}

            <AsistenciaForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={selectedAsistencia && selectedAsistencia.id ? handleUpdate : handleCreate}
                asistencia={selectedAsistencia}
                title={selectedAsistencia && selectedAsistencia.id ? 'Editar Asistencia' : 'Registrar Asistencia'}
                onDelete={selectedAsistencia && selectedAsistencia.id ? triggerDelete : null}
            />

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                message="¿Estás seguro de que deseas eliminar este registro?"
                title="Eliminar Asistencia"
            />
        </div>
    );
};

export default Asistencias;
