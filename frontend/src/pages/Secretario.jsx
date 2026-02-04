import React, { useState } from 'react';
import DatosBasicos from '../components/Secretario/DatosBasicos';
import ReporteS1 from '../components/Secretario/ReporteS1';
import ReporteS3 from '../components/Secretario/ReporteS3';
import ReporteS10 from '../components/Secretario/ReporteS10';

const Secretario = () => {
    const [activeSection, setActiveSection] = useState('datos');

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Servicios de Secretario</h1>
                <p className="page-description">Herramientas y reportes especiales para el secretario</p>
            </div>

            <div className="config-layout">
                <aside className="config-sidebar">
                    <nav className="config-nav">
                        <a href="#"
                            className={`config-nav-item ${activeSection === 'datos' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('datos'); }}
                        >
                            <span className="config-nav-icon">📋</span>
                            <span className="config-nav-text">Datos Básicos</span>
                        </a>
                        <a href="#"
                            className={`config-nav-item ${activeSection === 's1' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('s1'); }}
                        >
                            <span className="config-nav-icon">📊</span>
                            <span className="config-nav-text">Reporte S-1</span>
                        </a>
                        <a href="#"
                            className={`config-nav-item ${activeSection === 's3' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('s3'); }}
                        >
                            <span className="config-nav-icon">📈</span>
                            <span className="config-nav-text">Reporte S-3</span>
                        </a>
                        <a href="#"
                            className={`config-nav-item ${activeSection === 's10' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('s10'); }}
                        >
                            <span className="config-nav-icon">📉</span>
                            <span className="config-nav-text">Reporte S-10</span>
                        </a>
                    </nav>
                </aside>

                <main className="config-content">
                    {activeSection === 'datos' && <DatosBasicos />}
                    {activeSection === 's1' && <ReporteS1 />}
                    {activeSection === 's3' && <ReporteS3 />}
                    {activeSection === 's10' && <ReporteS10 />}
                </main>
            </div>
        </div>
    );
};

export default Secretario;
