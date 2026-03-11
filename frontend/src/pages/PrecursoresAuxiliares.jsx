import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../utils/api';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Common/Loading';
import Modal from '../components/Common/Modal';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const PrecursoresAuxiliares = () => {
    const { anioServicio } = useAnioServicio();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';

    const [filterAnio, setFilterAnio] = useState(anioServicio || dayjs().year());
    const [filterPublicadorId, setFilterPublicadorId] = useState('');
    const [publicadores, setPublicadores] = useState([]);
    const [precursores, setPrecursores] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Form fields
    const [formData, setFormData] = useState({
        mes: dayjs().format('YYYY-MM'),
        id_publicador: '',
        notas: ''
    });

    useEffect(() => {
        loadPublicadores();
    }, []);

    const loadPublicadores = async () => {
        try {
            const data = await apiRequest('/publicador/all');
            if (data && data.data) {
                setPublicadores(data.data.sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadPrecursores = async () => {
        if (!filterAnio) return;

        setLoading(true);
        try {
            let endpoint = `/precursoresAuxiliares/${filterAnio}`;

            // If we have a specific publicador selected, we might fetch only theirs
            // The backend endpoint `/precursoresAuxiliares/publicador/:id` doesn't filter by year natively in the route,
            // but we can just use the year endpoint and filter on frontend or modify the backend to accept query params.
            // For now, let's just fetch by year and filter locally if a publicador is selected.
            const data = await apiRequest(endpoint);
            if (data && data.data) {
                let items = data.data;
                if (filterPublicadorId) {
                    items = items.filter(p => p.id_publicador === parseInt(filterPublicadorId));
                }
                setPrecursores(items);
            } else {
                setPrecursores([]);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar precursores auxiliares', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!filterAnio) {
            showToast('Selecciona un año', 'warning');
            return;
        }
        loadPrecursores();
    };

    const clearFilters = () => {
        setFilterAnio(anioServicio || dayjs().year());
        setFilterPublicadorId('');
        setPrecursores([]);
    };

    // FORM HANDLERS
    const handleCreate = () => {
        setEditingRecord(null);
        setFormData({
            mes: dayjs().format('YYYY-MM'),
            id_publicador: filterPublicadorId || '',
            notas: ''
        });
        setIsFormOpen(true);
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setFormData({
            mes: dayjs(record.mes).format('YYYY-MM'),
            id_publicador: record.id_publicador || '',
            notas: record.notas || ''
        });
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            mes: formData.mes + '-01', // API expects YYYY-MM-DD
            id_publicador: parseInt(formData.id_publicador),
            notas: formData.notas
        };

        try {
            let result;
            if (editingRecord) {
                result = await apiRequest(`/precursoresAuxiliares/${editingRecord.id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                result = await apiRequest('/precursoresAuxiliares/add', {
                    method: 'POST',
                    body: payload
                });
            }

            if (result && result.success) {
                showToast(editingRecord ? 'Registro actualizado' : 'Registro creado', 'success');
                setIsFormOpen(false);
                loadPrecursores(); // Reload list
            }
        } catch (error) {
            showToast('Error al guardar', 'error');
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const result = await apiRequest(`/precursoresAuxiliares/${deleteId}`, {
                method: 'DELETE'
            });
            if (result && result.success) {
                showToast('Registro eliminado', 'success');
                loadPrecursores();
            }
        } catch (error) {
            showToast('Error al eliminar', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Precursores Auxiliares</h1>
                <p className="page-description">Gestión de nombramientos de precursores auxiliares por mes</p>
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
                        <div className="form-group">
                            <label className="form-label">Publicador (Opcional)</label>
                            <select
                                className="form-select"
                                value={filterPublicadorId}
                                onChange={(e) => setFilterPublicadorId(e.target.value)}
                            >
                                <option value="">Todos los publicadores</option>
                                {publicadores.map(p => (
                                    <option key={p.id} value={p.id}>{p.apellidos}, {p.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-sm mt-md">
                        <button className="btn btn-secondary" onClick={clearFilters}>Limpiar</button>
                        <button className="btn btn-primary" onClick={applyFilters}>Buscar</button>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="flex justify-between items-center mb-lg">
                    <button className="btn btn-primary" onClick={handleCreate}>+ Registrar P. Auxiliar</button>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Lista de Precursores Auxiliares</h3>
                </div>
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {precursores.length === 0 ? (
                                <p className="text-center text-muted">No se encontraron registros para los filtros seleccionados.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Mes</th>
                                            <th>Publicador</th>
                                            <th>Grupo</th>
                                            <th>Notas</th>
                                            {isAdmin && <th>Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {precursores.map(p => (
                                            <tr key={p.id}>
                                                <td data-label="Mes">{dayjs(p.mes).format('MMMM YYYY')}</td>
                                                <td data-label="Publicador" style={{ fontWeight: 'bold' }}>{p.publicador}</td>
                                                <td data-label="Grupo">Grupo {p.grupo}</td>
                                                <td data-label="Notas">{p.notas || '-'}</td>
                                                {isAdmin && (
                                                    <td data-label="Acciones">
                                                        <div className="flex gap-sm">
                                                            <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(p)}>✏️</button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(p.id)}>🗑️</button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                title={editingRecord ? 'Editar Registro' : 'Nuevo Precursor Auxiliar'}
                footer={
                    <div className="flex justify-end gap-sm">
                        <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleFormSubmit}>Guardar</button>
                    </div>
                }
            >
                <form className="grid grid-cols-1 gap-md">
                    <div className="form-group">
                        <label className="form-label">Mes</label>
                        <input type="month" className="form-input" name="mes" value={formData.mes} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Publicador</label>
                        <select className="form-select" name="id_publicador" value={formData.id_publicador} onChange={handleFormChange} required>
                            <option value="">Seleccionar publicador</option>
                            {publicadores.map(p => (
                                <option key={p.id} value={p.id}>{p.apellidos}, {p.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notas (Opcional)</label>
                        <input type="text" className="form-input" name="notas" value={formData.notas} onChange={handleFormChange} placeholder="P. Aux Continuo, etc." />
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Eliminar Registro"
                message="¿Estás seguro de que deseas eliminar este registro de precursor auxiliar?"
            />
        </div>
    );
};

export default PrecursoresAuxiliares;
