import React, { useState } from 'react';
import PDFViewer from '../components/Reportes/PDFViewer';
import ReportesS21 from '../components/Reportes/ReportesS21';
import ReporteGeneral from '../components/Reportes/ReporteGeneral';

const FillPDF = () => {
    const [activeSection, setActiveSection] = useState('visualizador');

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Reportes en PDF</h1>
                <p className="page-description">Visualiza reportes S21 y S88 en formato PDF</p>
            </div>

            <div className="config-layout">
                <aside className="config-sidebar">
                    <nav className="config-nav">
                        <a
                            href="#"
                            className={`config-nav-item ${activeSection === 'visualizador' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('visualizador'); }}
                        >
                            <span className="config-nav-icon">🔍</span>
                            <span className="config-nav-text">Visualizador</span>
                        </a>
                        <a href="#" className={`config-nav-item ${activeSection === 's21' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('s21'); }}>
                            <span className="config-nav-icon">📄</span>
                            <span className="config-nav-text">Reportes S-21</span>
                        </a>
                        <a
                            href="#"
                            className={`config-nav-item ${activeSection === 'general' ? 'active' : ''}`}
                            onClick={(e) => { e.preventDefault(); setActiveSection('general'); }}
                        >
                            <span className="config-nav-icon">📑</span>
                            <span className="config-nav-text">Reporte General</span>
                        </a>
                    </nav>
                </aside>

                <main className="config-content">
                    {activeSection === 'visualizador' && <PDFViewer />}
                    {activeSection === 's21' && <ReportesS21 />}
                    {activeSection === 'general' && <ReporteGeneral />}
                </main>
            </div>
        </div>
    );
};

export default FillPDF;
