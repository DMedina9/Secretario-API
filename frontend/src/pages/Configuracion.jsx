import React, { useState } from 'react';
import ConfigSettings from '../components/Configuracion/ConfigSettings';
import DataManagement from '../components/Configuracion/DataManagement';
import Maintenance from '../components/Configuracion/Maintenance';
import UserManagement from '../components/Configuracion/UserManagement';

const Configuracion = () => {
    const [activeSection, setActiveSection] = useState('configuraciones');

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Configuración</h1>
                <p className="page-description">Gestión de configuraciones del sistema</p>
            </div>

            <div className="config-layout">
                <aside className="config-sidebar">
                    <nav className="config-nav">
                        <a href="#" className={`config-nav-item ${activeSection === 'configuraciones' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('configuraciones'); }}>
                            <span className="config-nav-icon">⚙️</span>
                            <span className="config-nav-text">Configuraciones</span>
                        </a>
                        <a href="#" className={`config-nav-item ${activeSection === 'gestion' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('gestion'); }}>
                            <span className="config-nav-icon">📊</span>
                            <span className="config-nav-text">Gestión de Datos</span>
                        </a>
                        <a href="#" className={`config-nav-item ${activeSection === 'mantenimiento' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('mantenimiento'); }}>
                            <span className="config-nav-icon">🗑️</span>
                            <span className="config-nav-text">Mantenimiento</span>
                        </a>
                        <a href="#" className={`config-nav-item ${activeSection === 'usuarios' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('usuarios'); }}>
                            <span className="config-nav-icon">👥</span>
                            <span className="config-nav-text">Usuarios</span>
                        </a>
                    </nav>
                </aside>

                <main className="config-content">
                    {activeSection === 'configuraciones' && <ConfigSettings />}
                    {activeSection === 'gestion' && <DataManagement />}
                    {activeSection === 'mantenimiento' && <Maintenance />}
                    {activeSection === 'usuarios' && <UserManagement />}
                </main>
            </div>
        </div>
    );
};

export default Configuracion;
