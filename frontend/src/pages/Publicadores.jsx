import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiRequest } from '../utils/api';
import PublicadorForm from '../components/Publicadores/PublicadorForm';
import PublicadorCard from '../components/Publicadores/PublicadorCard';
import Modal from '../components/Common/Modal';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import Loading from '../components/Common/Loading';

const Publicadores = () => {
    const [publicadores, setPublicadores] = useState([]);
    const [filteredPublicadores, setFilteredPublicadores] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPublicador, setEditingPublicador] = useState(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [publicadorToDelete, setPublicadorToDelete] = useState(null);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [viewingPublicador, setViewingPublicador] = useState(null);

    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadPublicadores();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPublicadores(publicadores);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = publicadores.filter(p => {
                const fullName = `${p.nombre} ${p.apellidos}`.toLowerCase();
                return fullName.includes(term);
            });
            setFilteredPublicadores(filtered);
        }
    }, [searchTerm, publicadores]);

    const loadPublicadores = async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/publicador/all');
            if (data && data.data) {
                setPublicadores(data.data);
                setFilteredPublicadores(data.data);
            }
        } catch (error) {
            showToast('Error al cargar publicadores', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (data) => {
        try {
            setIsLoading(true);
            const result = await apiRequest('/publicador/add', {
                method: 'POST',
                body: data
            });

            if (result && result.success) {
                showToast('Publicador agregado', 'success');
                setIsFormOpen(false);
                loadPublicadores();
            }
        } catch (error) {
            showToast('Error al agregar publicador', 'error');
            setIsLoading(false);
        }
    };

    const handleUpdate = async (data) => {
        try {
            setIsLoading(true);
            const result = await apiRequest(`/publicador/${editingPublicador.id}`, {
                method: 'PUT',
                body: data
            });

            if (result && result.success) {
                showToast('Publicador actualizado', 'success');
                setIsFormOpen(false);
                setEditingPublicador(null);
                loadPublicadores();
            }
        } catch (error) {
            showToast('Error al actualizar publicador', 'error');
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!publicadorToDelete) return;

        try {
            setIsLoading(true);
            const result = await apiRequest(`/publicador/${publicadorToDelete.id}`, {
                method: 'DELETE'
            });

            if (result && result.success) {
                showToast('Publicador eliminado', 'success');
                loadPublicadores();
            }
        } catch (error) {
            showToast('Error al eliminar publicador', 'error');
            setIsLoading(false);
        } finally {
            setIsDeleteConfirmOpen(false);
            setPublicadorToDelete(null);
        }
    };

    const openCreateModal = () => {
        setEditingPublicador(null);
        setIsFormOpen(true);
    };

    const openEditModal = (publicador) => {
        setEditingPublicador(publicador);
        setIsFormOpen(true);
    };

    const openDeleteConfirm = (publicador) => {
        setPublicadorToDelete(publicador);
        setIsDeleteConfirmOpen(true);
    };

    const openCardModal = (publicador) => {
        setViewingPublicador(publicador);
        setIsCardModalOpen(true);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Publicadores</h1>
                <p className="page-description">Gestión de publicadores de la congregación</p>
            </div>

            {isAdmin && (
                <div className="flex justify-between items-center mb-lg">
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Agregar Publicador</button>
                </div>
            )}

            <div className="card">
                <div className="card-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="card-title">Lista de Publicadores</h3>
                    <div className="search-container" style={{ flexGrow: 1, maxWidth: '400px', position: 'relative' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Buscar publicador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            list="publicador-suggestions"
                        />
                        <datalist id="publicador-suggestions">
                            {publicadores.map(p => (
                                <option key={p.id} value={`${p.nombre} ${p.apellidos}`} />
                            ))}
                        </datalist>
                    </div>
                </div>
                <div className="card-body">
                    <div className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <table className="table">
                            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Grupo</th>
                                    <th>Tipo</th>
                                    <th>Priv.</th>
                                    <th>Tel. Móvil</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPublicadores.length > 0 ? (
                                    filteredPublicadores.map(p => (
                                        <tr key={p.id}>
                                            <td data-label="Nombre">
                                                <div style={{ fontWeight: 'bold' }}>{p.nombre} {p.apellidos}</div>
                                                <div className="text-muted" style={{ fontSize: '0.8em' }}>
                                                    {[
                                                        p.ungido ? 'Ungido' : null,
                                                        p.sordo ? 'Sordo' : null,
                                                        p.ciego ? 'Ciego' : null,
                                                        p.encarcelado ? 'Encarcelado' : null
                                                    ].filter(Boolean).join(', ')}
                                                </div>
                                            </td>
                                            <td data-label="Grupo">
                                                {p.grupo}
                                                {p.sup_grupo === 1 && <span className="badge badge-primary" style={{ marginLeft: '5px' }}>Sup</span>}
                                                {p.sup_grupo === 2 && <span className="badge badge-secondary" style={{ marginLeft: '5px' }}>Aux</span>}
                                            </td>
                                            <td data-label="Tipo">
                                                {p.id_tipo_publicador === 1 && 'Pub'}
                                                {p.id_tipo_publicador === 2 && 'PR'}
                                                {p.id_tipo_publicador === 3 && 'PA'}
                                            </td>
                                            <td data-label="Privilegio">
                                                {p.id_privilegio === 1 && 'Anciano'}
                                                {p.id_privilegio === 2 && 'Siervo Ministerial'}
                                            </td>
                                            <td data-label="Tel. Móvil">{p.telefono_movil}</td>
                                            <td data-label="Acciones">
                                                <div className="flex gap-sm">
                                                    <button className="btn btn-sm btn-secondary" onClick={() => openCardModal(p)} title="Ver Tarjeta">📇</button>
                                                    {isAdmin && (
                                                        <>
                                                            <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(p)} title="Editar">✏️</button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => openDeleteConfirm(p)} title="Eliminar">🗑️</button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted">No se encontraron publicadores</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isLoading && <Loading />}

            <PublicadorForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={editingPublicador ? handleUpdate : handleCreate}
                publicador={editingPublicador}
            />

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                message={`¿Estás seguro de que deseas eliminar al publicador ${publicadorToDelete?.nombre} ${publicadorToDelete?.apellidos}?`}
                title="Eliminar Publicador"
            />

            <Modal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                title="Tarjeta de Publicador"
            >
                <PublicadorCard
                    publicador={viewingPublicador}
                    onClose={() => setIsCardModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Publicadores;
