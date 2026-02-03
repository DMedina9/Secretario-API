import React, { useState } from 'react';
import InformesBulkEditor from '../components/Informes/InformesBulkEditor';
import InformesList from '../components/Informes/InformesList';
import { useAuth } from '../contexts/AuthContext';

const Informes = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [activeSection, setActiveSection] = useState('grupo');

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Informes de Predicación</h1>
                <p className="page-description">Gestión de informes mensuales de predicación</p>
            </div>

            <div className="config-layout">
                <aside className="config-sidebar">
                    <nav className="config-nav">
                        <a
                            href="#"
                            className={`config-nav-item ${activeSection === 'grupo' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('grupo'); }}
                        >
                            <span className="config-nav-icon">👥</span>
                            <span className="config-nav-text">Por Grupo</span>
                        </a>
                        <a
                            href="#"
                            className={`config-nav-item ${activeSection === 'publicador' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('publicador'); }}
                        >
                            <span className="config-nav-icon">👤</span>
                            <span className="config-nav-text">Por Publicador</span>
                        </a>
                    </nav>
                </aside>

                <main className="config-content">
                    {activeSection === 'grupo' && (
                        <div>
                            {isAdmin ? (
                                <InformesBulkEditor />
                            ) : (
                                <div className="card">
                                    <div className="card-body">
                                        <div className="alert alert-info">
                                            Necesitas permisos de administrador para acceder al editor.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSection === 'publicador' && (
                        <InformesList />
                    )}
                </main>
            </div>
        </div>
    );
};

export default Informes;
