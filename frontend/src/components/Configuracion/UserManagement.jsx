import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import Modal from '../Common/Modal';
import Loading from '../Common/Loading';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // null = create mode

    // Deletion state
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const result = await apiRequest('/user/all');
            if (result && result.data) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar usuarios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        try {
            await apiRequest(`/user/${deleteId}`, { method: 'DELETE' });
            showToast('Usuario eliminado', 'success');
            loadUsers();
        } catch (error) {
            showToast('Error al eliminar usuario', 'error');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">Administración de Usuarios</h3>
                <p className="card-subtitle">Gestiona los usuarios del sistema</p>
            </div>
            <div className="card-body">
                <button className="btn btn-primary mb-md" onClick={handleCreate}>
                    Crear Usuario
                </button>

                {loading && <Loading />}

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td data-label="ID">{user.id}</td>
                                    <td data-label="Usuario">{user.username}</td>
                                    <td data-label="Email">{user.email}</td>
                                    <td data-label="Nombre">{user.firstName}</td>
                                    <td data-label="Apellido">{user.lastName}</td>
                                    <td data-label="Rol">
                                        <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td data-label="Acciones">
                                        <button className="btn btn-sm btn-secondary mr-sm" onClick={() => handleEdit(user)}>Editar</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(user.id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr><td colSpan="7" className="text-center text-muted">No hay usuarios</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={editingUser}
                onSave={() => { setIsModalOpen(false); loadUsers(); }}
            />

            <ConfirmDialog
                isOpen={!!deleteId}
                title="Eliminar Usuario"
                message="¿Estás seguro de que deseas eliminar este usuario?"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
};

const UserFormModal = ({ isOpen, onClose, user, onSave }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        username: '', email: '', firstName: '', lastName: '', password: '', role: 'USER'
    });

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' });
        } else {
            setFormData({ username: '', email: '', firstName: '', lastName: '', password: '', role: 'USER' });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const body = { ...formData };
            if (!body.password) delete body.password; // Don't send empty password if editing

            let result;
            if (user) {
                result = await apiRequest(`/user/${user.id}`, { method: 'PUT', body });
            } else {
                if (!formData.password) {
                    showToast('Contraseña es requerida', 'warning');
                    return;
                }
                result = await apiRequest('/user', { method: 'POST', body });
            }

            if (result && result.success) {
                showToast('Usuario guardado', 'success');
                onSave();
            } else {
                showToast(result.error || 'Error al guardar', 'error');
            }
        } catch (error) {
            showToast('Error al procesar solicitud', 'error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? "Editar Usuario" : "Crear Usuario"}>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="form-group">
                    <label className="form-label">Usuario</label>
                    <input name="username" value={formData.username} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="form-input" type="email" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Apellido</label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input name="password" value={formData.password} onChange={handleChange} className="form-input" type="password" placeholder={user ? "Dejar vacío para mantener" : ""} />
                </div>
                <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="form-select">
                        <option value="USER">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                <div className="col-span-full flex justify-end gap-sm mt-md">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

export default UserManagement;
