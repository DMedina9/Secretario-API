// ============================================
// SECRETARIO MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, getAnioServicio, getMesInforme } from '../app.js';

export async function renderSecretario(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Servicios de Secretario</h1>
            <p class="page-description">Herramientas y reportes especiales para el secretario</p>
        </div>
        
        <div class="config-layout">
            <!-- Sidebar Navigation -->
            <aside class="config-sidebar">
                <nav class="config-nav">
                    <a href="#" data-section="datos" class="config-nav-item active">
                        <span class="config-nav-icon">📋</span>
                        <span class="config-nav-text">Datos Básicos</span>
                    </a>
                    <a href="#" data-section="s1" class="config-nav-item">
                        <span class="config-nav-icon">📊</span>
                        <span class="config-nav-text">Reporte S-1</span>
                    </a>
                    <a href="#" data-section="s3" class="config-nav-item">
                        <span class="config-nav-icon">📈</span>
                        <span class="config-nav-text">Reporte S-3</span>
                    </a>
                    <a href="#" data-section="s10" class="config-nav-item">
                        <span class="config-nav-icon">📉</span>
                        <span class="config-nav-text">Reporte S-10</span>
                    </a>
                </nav>
            </aside>
            
            <!-- Content Area -->
            <main class="config-content">
                <!-- Section: Datos Básicos -->
                <div id="section-datos" class="config-section active">
                    <div class="grid grid-cols-2 gap-lg">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Datos Básicos</h3>
                            </div>
                            <div class="card-body">
                                <div id="datosBasicosContainer">
                                    <p class="text-muted">Cargando...</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Mes de Informe Actual</h3>
                            </div>
                            <div class="card-body">
                                <div id="mesInformeContainer">
                                    <p class="text-muted">Cargando...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Reporte S-1 -->
                <div id="section-s1" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Reporte S-1: Estadísticas Mensuales</h3>
                            <p class="card-subtitle">Estadísticas de la congregación para un mes específico</p>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">Mes</label>
                                <input type="month" class="form-input" id="s1Month" style="max-width: 300px;" value="${getMesInforme().format('YYYY-MM')}">
                            </div>
                            <button class="btn btn-primary" id="loadS1Btn">Generar Reporte S-1</button>
                            
                            <div id="s1Container" class="mt-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Section: Reporte S-3 -->
                <div id="section-s3" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Reporte S-3: Asistencia Anual</h3>
                            <p class="card-subtitle">Registro de asistencia por semanas del año de servicio</p>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 gap-md" style="max-width: 600px;">
                                <div class="form-group">
                                    <label class="form-label">Año de Servicio</label>
                                    <input type="number" class="form-input" id="s3Year" min="${getAnioServicio() - 2}" max="${getAnioServicio()}" value="${getAnioServicio()}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tipo</label>
                                    <select class="form-select" id="s3Type">
                                        <option value="ES">Entre Semana</option>
                                        <option value="FS">Fin de Semana</option>
                                    </select>
                                </div>
                            </div>
                            <button class="btn btn-primary" id="loadS3Btn">Generar Reporte S-3</button>
                            
                            <div id="s3Container" class="mt-lg"></div>
                        </div>
                    </div>
                </div>

                <!-- Section: Reporte S-10 -->
                <div id="section-s10" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Reporte S-10: Análisis de la Congregación</h3>
                            <p class="card-subtitle">Estadísticas anuales de la congregación por año de servicio</p>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">Año de Servicio</label>
                                <input type="number" class="form-input" id="s10Year" min="${getAnioServicio() - 2}" max="${getAnioServicio()}" value="${getAnioServicio()}" style="max-width: 300px;">
                            </div>
                            <button class="btn btn-primary" id="loadS10Btn">Generar Reporte S-10</button>
                            
                            <div id="s10Container" class="mt-lg"></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Setup navigation between sections
    setupServiciosNavigation();

    // Setup button handlers
    document.getElementById('loadS1Btn').addEventListener('click', loadS1Report);
    document.getElementById('loadS3Btn').addEventListener('click', loadS3Report);
    document.getElementById('loadS10Btn').addEventListener('click', loadS10Report);

    // Load basic data
    await loadDatosBasicos();
}

// ============================================
// SERVICIOS SECTION NAVIGATION
// ============================================
function setupServiciosNavigation() {
    const navItems = document.querySelectorAll('.config-nav-item');
    const sections = document.querySelectorAll('.config-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show selected section, hide others
            sections.forEach(section => {
                if (section.id === `section-${sectionId}`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

async function loadDatosBasicos() {
    const container = document.getElementById('datosBasicosContainer');
    const mesContainer = document.getElementById('mesInformeContainer');

    try {
        // Load privilegios
        const privilegiosData = await apiRequest('/publicador/privilegios');
        const tiposData = await apiRequest('/publicador/tipos-publicador');

        let privilegiosHTML = '<p class="text-muted">No hay privilegios</p>';
        if (privilegiosData && privilegiosData.data) {
            privilegiosHTML = '<ul>' +
                privilegiosData.data.map(p => `<li>${p.descripcion}</li>`).join('') +
                '</ul>';
        }

        let tiposHTML = '<p class="text-muted">No hay tipos</p>';
        if (tiposData && tiposData.data) {
            tiposHTML = '<ul>' +
                tiposData.data.map(t => `<li>${t.descripcion}</li>`).join('') +
                '</ul>';
        }

        container.innerHTML = `
            <div class="mb-md">
                <h5>Privilegios</h5>
                <div id="privilegiosData">
                    ${privilegiosHTML}
                </div>
            </div>
            <div>
                <h5>Tipos de Publicador</h5>
                <div id="tiposData">
                    ${tiposHTML}
                </div>
            </div>
        `;

        mesContainer.innerHTML = `
            <div class="stat-value">${getMesInforme().format('MMMM YYYY')}</div>
        `;
    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar datos básicos</div>';
    }
}

async function loadS1Report() {
    const month = document.getElementById('s1Month').value || getMesInforme().format('YYYY-MM');

    if (!month) {
        showToast('Por favor selecciona un mes', 'warning');
        return;
    }

    const container = document.getElementById('s1Container');

    try {
        showLoading();

        const data = await apiRequest(`/secretario/s1/${month}-01`);

        hideLoading();

        if (data && data.success && data.data) {
            const encabezados = data.data;

            let html = '<div class="grid grid-cols-1 gap-lg">';

            encabezados.forEach((enc, index) => {
                if (index === 0 || enc.subsecciones) {
                    html += `
                        <div class="card">
                            <div class="card-header">
                                <h4>${enc.titulo || ''}</h4>
                            </div>
                            <div class="card-body">
                                ${enc.subsecciones ? enc.subsecciones.map(sub => `
                                    <div class="flex justify-between mb-md">
                                        <span><strong>${sub.label}:</strong></span>
                                        <span>${sub.valor !== undefined && sub.valor !== null ? Math.round(sub.valor * 100) / 100 : 'N/A'}</span>
                                    </div>
                                    ${sub.descripcion ? `<p class="text-muted text-sm">${sub.descripcion}</p>` : ''}
                                `).join('') : ''}
                            </div>
                        </div>
                    `;
                }
            });

            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = `<div class="alert alert-error">No se pudieron cargar los datos del reporte S-1</div>`;
        }

    } catch (error) {
        hideLoading();
        container.innerHTML = '<div class="alert alert-error">Error al cargar reporte S-1</div>';
    }
}

async function loadS3Report() {
    const year = document.getElementById('s3Year').value || getAnioServicio();
    const type = document.getElementById('s3Type').value;

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    const container = document.getElementById('s3Container');

    try {
        showLoading();

        const data = await apiRequest(`/secretario/s3/${year}/${type}`);

        hideLoading();

        if (data && data.success && data.data) {
            const rows = data.data;

            if (rows.length === 0) {
                container.innerHTML = '<div class="alert alert-info">No hay datos para el año y tipo seleccionados</div>';
                return;
            }

            let html = `
                <div class="card">
                    <div class="card-header">
                        <h4>Reporte S-3: ${type === 'ES' ? 'Entre Semana' : 'Fin de Semana'}</h4>
                        <p class="card-subtitle">Año de servicio: ${year}</p>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Año</th>
                                        <th>Semana 1</th>
                                        <th>Semana 2</th>
                                        <th>Semana 3</th>
                                        <th>Semana 4</th>
                                        <th>Semana 5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows.map(row => `
                                        <tr>
                                            <td data-label="Mes">${row.month}</td>
                                            <td data-label="Año">${row.year}</td>
                                            <td data-label="Semana 1">${row.semana_1 || '-'}</td>
                                            <td data-label="Semana 2">${row.semana_2 || '-'}</td>
                                            <td data-label="Semana 3">${row.semana_3 || '-'}</td>
                                            <td data-label="Semana 4">${row.semana_4 || '-'}</td>
                                            <td data-label="Semana 5">${row.semana_5 || '-'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-error">No se pudieron cargar los datos del reporte S-3</div>';
        }

    } catch (error) {
        hideLoading();
        container.innerHTML = '<div class="alert alert-error">Error al cargar reporte S-3</div>';
    }
}

async function loadS10Report() {
    const year = document.getElementById('s10Year').value || getAnioServicio();

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    const container = document.getElementById('s10Container');

    try {
        showLoading();

        const data = await apiRequest(`/secretario/s10/${year}`);

        hideLoading();

        if (data && data.success && data.data) {
            const reportData = data.data;

            let html = `
                <div class="grid grid-cols-1 gap-lg">
                    <!-- Meeting Attendance Card -->
                    <div class="card">
                        <div class="card-header">
                            <h4>Promedio de Asistencia a las Reuniones</h4>
                        </div>
                        <div class="card-body flex justify-between">
                            <div class="flex flex-col">
                                <span class="mt-md"><strong>Reunión del fin de semana</strong></span>
                                <span>${reportData.asistencia.fin_de_semana}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="mt-md"><strong>Reunión de entre semana</strong></span>
                                <span>${reportData.asistencia.entre_semana}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Congregation Totals Card -->
                    <div class="card">
                        <div class="card-header">
                            <h4>Totales de la Congregación</h4>
                        </div>
                        <div class="card-body flex justify-between">
                            <div class="flex flex-col">
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Todos los publicadores activos</strong></span>
                                    <span>${reportData.totales_congregacion.publicadores_activos}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Nuevos publicadores inactivos</strong></span>
                                    <span>${reportData.totales_congregacion.nuevos_inactivos}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Publicadores reactivados</strong></span>
                                    <span>${reportData.totales_congregacion.reactivados}</span>
                                </div>
                            </div>
                            <div class="flex flex-col">
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Publicadores sordos</strong></span>
                                    <span>${reportData.totales_congregacion.sordos}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Publicadores ciegos</strong></span>
                                    <span>${reportData.totales_congregacion.ciegos}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="mt-md"><strong>Publicadores encarcelados</strong></span>
                                    <span>${reportData.totales_congregacion.encarcelados}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Territories Card -->
                    <div class="card">
                        <div class="card-header">
                            <h4>Territorios Abarcados</h4>
                        </div>
                        <div class="card-body flex justify-between">
                            <div class="flex flex-col">
                                <span class="mt-md"><strong>Número total de territorios</strong></span>
                                <span>${reportData.territorios.total}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="mt-md"><strong>Territorios no predicados</strong></span>
                                <span>${reportData.territorios.no_predicados}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="alert alert-error">No se pudieron cargar los datos del reporte S-10</div>';
        }

    } catch (error) {
        hideLoading();
        container.innerHTML = '<div class="alert alert-error">Error al cargar reporte S-10</div>';
    }
}

