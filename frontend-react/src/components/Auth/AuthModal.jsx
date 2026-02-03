import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../Common/Modal';

const AuthModal = ({ isOpen, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                showToast('Inicio de sesión exitoso', 'success');
                onClose();
                setUsername('');
                setPassword('');
            } else {
                showToast(result.error || 'Error al iniciar sesión', 'error');
            }
        } catch (error) {
            showToast('Error de conexión', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Iniciar Sesión"
        >
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label className="form-label" htmlFor="loginUsername">Nombre de Usuario</label>
                    <input
                        type="text"
                        className="form-input"
                        id="loginUsername"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="loginPassword">Contraseña</label>
                    <input
                        type="password"
                        className="form-input"
                        id="loginPassword"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={isLoading}
                >
                    {isLoading ? 'Cargando...' : 'Entrar'}
                </button>
            </form>
        </Modal>
    );
};

export default AuthModal;
