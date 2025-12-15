// ============================================
// SECRETARIO MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading } from '../app.js';

export async function renderSecretario(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Servicios de Secretario</h1>
            <p class="page-description">Herramientas y reportes especiales para el secretario</p>
        </div>
        
        <div class="grid grid-cols-2 mb-xl">
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
        
        <div class="card mb-xl">
            <div class="card-header">
                <h3 class="card-title">Reporte S-1: Estadísticas Mensuales</h3>
                <p class="card-subtitle">Estadísticas de la congregación para un mes específico</p>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="form-label">Mes (YYYY-MM-DD)</label>
                    <input type="date" class="form-input" id="s1Month" style="max-width: 300px;">
                </div>
                <button class="btn btn-primary" id="loadS1Btn">Generar Reporte S-1</button>
                
                <div id="s1Container" class="mt-lg"></div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Reporte S-3: Asistencia Anual</h3>
                <p class="card-subtitle">Registro de asistencia por semanas del año de servicio</p>
            </div>
            <div class="card-body">
                <div class="grid grid-cols-2" style="max-width: 600px;">
                    <div class="form-group">
                        <label class="form-label">Año de Servicio</label>
                        <input type="number" class="form-input" id="s3Year" min="2020" max="2030" placeholder="2024">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo</label>
                        <select class="form-select" id="s3Type">
                            <option value="ES">Entre Semana (ES)</option>
                            <option value="FS">Fin de Semana (FS)</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary" id="loadS3Btn">Generar Reporte S-3</button>
                
                <div id="s3Container" class="mt-lg"></div>
            </div>
        </div>
    `;

    // Setup button handlers
    document.getElementById('loadS1Btn').addEventListener('click', loadS1Report);
    document.getElementById('loadS3Btn').addEventListener('click', loadS3Report);

    // Load basic data
    await loadDatosBasicos();
}

async function loadDatosBasicos() {
    const container = document.getElementById('datosBasicosContainer');
    const mesContainer = document.getElementById('mesInformeContainer');

    try {
        // Load privilegios
        const privilegiosData = await apiRequest('/secretario/privilegios');
        const tiposData = await apiRequest('/secretario/tipos-publicador');
        const mesData = await apiRequest('/secretario/mes-informe');

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

        if (mesData && mesData.data) {
            const fecha = new Date(mesData.data);
            mesContainer.innerHTML = `
                <div class="stat-value">${fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</div>
            `;
        } else {
            mesContainer.innerHTML = `
                <p class="text-muted">No hay mes de informe registrado</p>
            `;
        }

    } catch (error) {
        container.innerHTML = '<div class="alert alert-error">Error al cargar datos básicos</div>';
    }
}

async function loadS1Report() {
    const month = document.getElementById('s1Month').value;

    if (!month) {
        showToast('Por favor selecciona un mes', 'warning');
        return;
    }

    const container = document.getElementById('s1Container');

    try {
        showLoading();

        const data = await apiRequest('/secretario/s1', {
            method: 'POST',
            body: JSON.stringify({ month })
        });

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
    const year = document.getElementById('s3Year').value;
    const type = document.getElementById('s3Type').value;

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    const container = document.getElementById('s3Container');

    try {
        showLoading();

        const data = await apiRequest('/secretario/s3', {
            method: 'POST',
            body: JSON.stringify({ anio: parseInt(year), type })
        });

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
                                            <td>${row.month}</td>
                                            <td>${row.year}</td>
                                            <td>${row.semana_1 || '-'}</td>
                                            <td>${row.semana_2 || '-'}</td>
                                            <td>${row.semana_3 || '-'}</td>
                                            <td>${row.semana_4 || '-'}</td>
                                            <td>${row.semana_5 || '-'}</td>
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
