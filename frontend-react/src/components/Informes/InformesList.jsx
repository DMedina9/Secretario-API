import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../../utils/api';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../Common/Loading';
import Modal from '../Common/Modal';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../Common/ConfirmDialog';

const InformesList = () => {
    const { anioServicio } = useAnioServicio();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isAdmin = user?.role === 'admin';

    const [filterAnio, setFilterAnio] = useState(anioServicio || dayjs().year());
    const [filterPublicadorId, setFilterPublicadorId] = useState('');
    const [publicadores, setPublicadores] = useState([]);
    const [informes, setInformes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form Modal State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingInforme, setEditingInforme] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Form fields
    const [formData, setFormData] = useState({
        mes: dayjs().format('YYYY-MM'),
        id_publicador: '',
        id_tipo_publicador: 1,
        predico_en_el_mes: 1,
        horas: 0,
        cursos_biblicos: 0
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

    const loadInformes = async () => {
        // Original code requires filters
        /*
        if (!filterPublicadorId) {
            // If user didn't select publisher, maybe we can fetch all for the year?
            // The original code endpoint is `/informe/${idPublicador}/${anio}`.
            // If idPublicador is empty, does backend support it?
            // Original code: `loadInformes` calls `/informe/${idPublicador}/${anio}`
            // If idPublicador is empty string: `/informe//2025` -> Double slash?
            // Backend likely handles `/informe//:anio` not well or it's mapped to `/informe/:id/:anio`.
            // Let's assume we need to select publicador OR maybe backend has `/informe/all/:anio`?
            // Wait, original code `loadInformes` passes defaults: `loadInformes(anio = '', idPublicador = '')`
            // `const endpoint = /informe/${idPublicador}/${anio}`;`
            // If both empty: `/informe//` -> 404 likely.
            
            // Let's force selection of publicador OR year. 
            // If I look at `/modules/informes.js`:
            // `function loadInformes(anio = '', idPublicador = '')`
            // If I look at `backend` (not visible here but inferred), usually `/informe/` might list all?
            // The table says "Aplica filtros para ver los informes". So initially empty.
        }
        */

        if (!filterAnio) return;

        setLoading(true);
        try {
            // Construct endpoint. If publicadorId is present use it, otherwise maybe just year?
            // If the original UI forces filtering, I'll follow that.
            // If I omit publicadorId, the URL is `/informe//2025`.
            // React Router / Express Router might interpret `//` as `/`.
            // Let's try to be smart. If publicadorId is empty, maybe we shouldn't fetch or fetch different endpoint.
            // However, looking at original code, `loadInformes` is called by `applyFilters` which grabs values from input.

            let endpoint = '';
            if (filterPublicadorId) {
                endpoint = `/informe/${filterPublicadorId}/${filterAnio}`;
            } else {
                // Should we fetch all for year? Maybe `/informe/all/${filterAnio}`?
                // The original code didn't seem to have a "view all for year" explicit button unless filterPublicador was optional.
                // If I check `dashboard.js`, clicking "Informes" calls `renderInformes`.
                // `renderInformes` renders empty table saying "Aplica filtros".
                // So initial state is empty.
                setInformes([]);
                setLoading(false);
                if (filterPublicadorId === '') {
                    // Optionally show toast "Select publicador"
                }
                return;
            }

            const data = await apiRequest(endpoint);
            if (data && data.data) {
                setInformes(data.data);
            } else {
                setInformes([]);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar informes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        if (!filterPublicadorId && !filterAnio) {
            showToast('Selecciona filtros', 'warning');
            return;
        }
        loadInformes();
    };

    const clearFilters = () => {
        setFilterAnio(anioServicio || dayjs().year());
        setFilterPublicadorId('');
        setInformes([]);
    };

    // FORM HANDLERS
    const handleCreate = () => {
        setEditingInforme(null);
        setFormData({
            mes: dayjs().format('YYYY-MM'),
            id_publicador: filterPublicadorId || '',
            id_tipo_publicador: 1,
            predico_en_el_mes: 1,
            horas: 0,
            cursos_biblicos: 0
        });
        setIsFormOpen(true);
    };

    const handleEdit = (informe) => {
        setEditingInforme(informe);
        setFormData({
            mes: dayjs(informe.mes).format('YYYY-MM'),
            id_publicador: informe.id_publicador || '',
            id_tipo_publicador: informe.id_tipo_publicador || 1,
            predico_en_el_mes: informe.predico_en_el_mes ? 1 : 0,
            horas: informe.horas || 0,
            cursos_biblicos: informe.cursos_biblicos || 0
        });
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            mes: formData.mes + '-01', // API expects YYYY-MM-DD
            id_publicador: parseInt(formData.id_publicador),
            id_tipo_publicador: parseInt(formData.id_tipo_publicador),
            predico_en_el_mes: parseInt(formData.predico_en_el_mes),
            horas: parseInt(formData.horas),
            cursos_biblicos: parseInt(formData.cursos_biblicos)
        };

        try {
            let result;
            if (editingInforme) {
                result = await apiRequest(`/informe/${editingInforme.id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                result = await apiRequest('/informe/add', {
                    method: 'POST',
                    body: payload
                });
            }

            if (result && result.success) {
                showToast(editingInforme ? 'Informe actualizado' : 'Informe creado', 'success');
                setIsFormOpen(false);
                loadInformes(); // Reload list
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
            const result = await apiRequest(`/informe/${deleteId}`, {
                method: 'DELETE'
            });
            if (result && result.success) {
                showToast('Informe eliminado', 'success');
                loadInformes();
            }
        } catch (error) {
            showToast('Error al eliminar', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div>
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Filtros</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-3 gap-md">
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
                            <label className="form-label">Publicador</label>
                            <select
                                className="form-select"
                                value={filterPublicadorId}
                                onChange={(e) => setFilterPublicadorId(e.target.value)}
                            >
                                <option value="">Seleccionar publicador...</option>
                                {publicadores.map(p => (
                                    <option key={p.id} value={p.id}>{p.apellidos}, {p.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-sm mt-md">
                        <button className="btn btn-secondary" onClick={clearFilters}>Limpiar</button>
                        <button className="btn btn-primary" onClick={applyFilters}>Aplicar Filtros</button>
                    </div>
                </div>
            </div>

            {isAdmin && (
                <div className="flex justify-between items-center mb-lg">
                    <button className="btn btn-primary" onClick={handleCreate}>+ Agregar Informe</button>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Lista de Informes</h3>
                </div>
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {informes.length === 0 ? (
                                <p className="text-center text-muted">Aplica filtros para ver resultados</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Mes</th>
                                            <th>Publicador</th>
                                            <th>Tipo</th>
                                            <th>Predicó</th>
                                            <th>Horas</th>
                                            <th>Cursos</th>
                                            <th>Estatus</th>
                                            {isAdmin && <th>Acciones</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {informes.map(i => (
                                            <tr key={i.id}>
                                                <td data-label="Mes">{dayjs(i.mes).format('YYYY-MM')}</td>
                                                <td data-label="Publicador">{i.publicador}</td>
                                                <td data-label="Tipo">{i.tipo_publicador}</td>
                                                <td data-label="Predicó">
                                                    {i.predico_en_el_mes ?
                                                        <span className="badge badge-success">Sí</span> :
                                                        <span className="badge badge-error">No</span>
                                                    }
                                                </td>
                                                <td data-label="Horas">{i.horas}</td>
                                                <td data-label="Cursos">{i.cursos_biblicos}</td>
                                                <td data-label="Estatus">
                                                    {i.Estatus === 'Activo' ?
                                                        <span className="badge badge-success">Activo</span> :
                                                        <span className="badge badge-warning">Inactivo</span>
                                                    }
                                                </td>
                                                {isAdmin && (
                                                    <td data-label="Acciones">
                                                        <div className="flex gap-sm">
                                                            <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(i)}>Editar</button>
                                                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteId(i.id)}>Eliminar</button>
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
                title={editingInforme ? 'Editar Informe' : 'Agregar Informe'}
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
                        <label className="form-label">Tipo de publicador</label>
                        <select className="form-select" name="id_tipo_publicador" value={formData.id_tipo_publicador} onChange={handleFormChange} required>
                            <option value="1">Publicador</option>
                            <option value="2">Precursor Regular</option>
                            <option value="3">Precursor Auxiliar</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">¿Predicó en el mes?</label>
                        <select className="form-select" name="predico_en_el_mes" value={formData.predico_en_el_mes} onChange={handleFormChange} required>
                            <option value="1">Sí</option>
                            <option value="0">No</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="form-label">Horas</label>
                            <input type="number" className="form-input" name="horas" min="0" value={formData.horas} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cursos bíblicos</label>
                            <input type="number" className="form-input" name="cursos_biblicos" min="0" value={formData.cursos_biblicos} onChange={handleFormChange} />
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Eliminar Informe"
                message="¿Estás seguro de que deseas eliminar este informe?"
            />
        </div>
    );
};

export default InformesList;
