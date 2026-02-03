import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

const Dashboard = () => {
    const { isAuthenticated } = useAuth();
    const [apiStatus, setApiStatus] = useState('...');
    const [statusColor, setStatusColor] = useState('var(--text-muted)');

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const data = await apiRequest('/status');
                if (data && data.status) {
                    setApiStatus(data.status);
                    setStatusColor('var(--color-success)');
                } else {
                    setApiStatus('Desconectado');
                    setStatusColor('var(--color-error)');
                }
            } catch (error) {
                setApiStatus('Error');
                setStatusColor('var(--color-error)');
            }
        };

        loadStatus();
    }, []);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Sistema de Gestión Secretario</h1>
                <p className="page-description">Bienvenido al sistema de gestión para secretarios de congregación</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value" style={{ color: statusColor }}>{apiStatus}</div>
                    <div className="stat-label">Estado del Sistema</div>
                </div>
            </div>

            <div className="grid grid-cols-3">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Publicadores</h3>
                        <p className="card-subtitle">Gestiona la información de publicadores</p>
                    </div>
                    <div className="card-body">
                        <p>Administra el registro de publicadores, precursores y privilegios de servicio.</p>
                    </div>
                    <div className="card-footer">
                        <Link to="/publicadores" className="btn btn-primary">Ver Publicadores</Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Asistencias</h3>
                        <p className="card-subtitle">Registro de asistencia a reuniones</p>
                    </div>
                    <div className="card-body">
                        <p>Lleva el control de la asistencia a las reuniones entre semana y fin de semana.</p>
                    </div>
                    <div className="card-footer">
                        <Link to="/asistencias" className="btn btn-primary">Ver Asistencias</Link>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Informes</h3>
                        <p className="card-subtitle">Informes de predicación</p>
                    </div>
                    <div className="card-body">
                        <p>Gestiona los informes mensuales de predicación y cursos bíblicos.</p>
                    </div>
                    <div className="card-footer">
                        <Link to="/informes" className="btn btn-primary">Ver Informes</Link>
                    </div>
                </div>
            </div>

            {isAuthenticated() ? (
                <div className="card mt-xl">
                    <div className="card-header">
                        <h3 className="card-title">Servicios de Secretario</h3>
                        <p className="card-subtitle">Herramientas y reportes especiales</p>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-2">
                            <div>
                                <h5>Reporte S-1</h5>
                                <p>Estadísticas mensuales de la congregación con subsecciones detalladas.</p>
                            </div>
                            <div>
                                <h5>Reporte S-3</h5>
                                <p>Registro anual de asistencia por semanas.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-footer">
                        <Link to="/secretario" className="btn btn-primary">Ver Servicios</Link>
                    </div>
                </div>
            ) : (
                <div className="card mt-xl">
                    <div className="card-body text-center">
                        <h3>Inicia sesión para acceder a todas las funcionalidades</h3>
                        <p className="text-muted">Gestiona publicadores, asistencias, informes y genera reportes especiales.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
