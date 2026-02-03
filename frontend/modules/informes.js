// ============================================
// INFORMES MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm, getMesInforme, getAnioServicio } from '../app.js';
import { hasPermission } from './auth.js';

let currentInformes = [];
let currentPublicadores = [];
let bulkInformesData = [];
let selectedMonth = '';
let selectedGroup = '';

export async function renderInformes(container) {
    // Set default month to current month
    const defaultMonth = getMesInforme().format('YYYY-MM');

    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Informes de Predicación</h1>
            <p class="page-description">Gestión de informes mensuales de predicación</p>
        </div>
        
        <div class="config-layout">
            <!-- Sidebar Navigation -->
            <aside class="config-sidebar">
                <nav class="config-nav">
                    <a href="#" data-section="grupo" class="config-nav-item active">
                        <span class="config-nav-icon">👥</span>
                        <span class="config-nav-text">Por Grupo</span>
                    </a>
                    <a href="#" data-section="publicador" class="config-nav-item">
                        <span class="config-nav-icon">👤</span>
                        <span class="config-nav-text">Por Publicador</span>
                    </a>
                </nav>
            </aside>
            
            <!-- Content Area -->
            <main class="config-content">
                <!-- Section: Por Grupo -->
                <div id="section-grupo" class="config-section active">
                    ${hasPermission('admin') ? `
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">✏️ Editor de Informes</h3>
                                <p class="card-subtitle">Edita múltiples informes simultáneamente por grupo</p>
                            </div>
                            <div class="card-body">
                                <div class="grid grid-cols-3 gap-lg mb-lg">
                                    <div class="form-group">
                                        <label class="form-label">Mes</label>
                                        <input type="month" class="form-input" id="bulkMonth" value="${defaultMonth}" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Grupo</label>
                                        <select class="form-select" id="bulkGroup">
                                            <option value="">Seleccionar grupo</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="display: flex; align-items: flex-end;">
                                        <button class="btn btn-primary" id="loadBulkBtn" style="width: 100%;">Aplicar Filtros</button>
                                    </div>
                                </div>
                                <div id="bulkEditorContainer"></div>
                            </div>
                        </div>
                    ` : '<div class="alert alert-info">Necesitas permisos de administrador para acceder al editor.</div>'}
                </div>

                <!-- Section: Por Publicador -->
                <div id="section-publicador" class="config-section">
                    <div class="card mb-lg">
                        <div class="card-header">
                            <h3 class="card-title">Filtros</h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-3">
                                <div class="form-group">
                                    <label class="form-label">Año de Servicio</label>
                                    <input type="number" class="form-input" id="filterAnio" min="${getAnioServicio() - 2}" max="${getAnioServicio()}" value="${getAnioServicio()}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Publicador</label>
                                    <select class="form-select" id="filterPublicador"></select>
                                </div>
                            </div>
                            <div class="flex justify-end gap-sm mt-md">
                                <button class="btn btn-secondary" id="clearFiltersBtn">Limpiar</button>
                                <button class="btn btn-primary" id="applyFiltersBtn">Aplicar Filtros</button>
                            </div>
                        </div>
                    </div>
                
                    ${hasPermission('admin') ? `
                        <div class="flex justify-between items-center mb-lg">
                            <button class="btn btn-primary" id="addInformeBtn">+ Agregar Informe</button>
                        </div>
                    ` : ''}
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Lista de Informes</h3>
                        </div>
                        <div class="card-body">
                            <div id="informesTableContainer">
                                <p class="text-center text-muted">Aplica filtros para ver los informes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        
        <div id="informeFormModal"></div>
    `;

    // Setup navigation between sections
    setupInformesNavigation();

    await renderPublicadores();

    // Setup bulk editor if admin
    if (hasPermission('admin')) {
        await loadGroups();
        document.getElementById('loadBulkBtn').addEventListener('click', loadBulkEditor);
    }

    // Setup filter buttons
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

    const addBtn = document.getElementById('addInformeBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showInformeForm());
    }
}

// ============================================
// INFORMES SECTION NAVIGATION
// ============================================
function setupInformesNavigation() {
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

// Remove old openTab function - no longer needed


async function applyFilters() {
    const anio = document.getElementById('filterAnio').value || getAnioServicio();
    const idPublicador = document.getElementById('filterPublicador').value || '';
    //const dir = document.getElementById('filterDir').value || 'DESC';

    await loadInformes(anio, idPublicador);
}

function clearFilters() {
    document.getElementById('filterAnio').value = '';
    document.getElementById('filterPublicador').value = '';
    //document.getElementById('filterDir').value = 'DESC';

    document.getElementById('informesTableContainer').innerHTML =
        '<p class="text-center text-muted">Aplica filtros para ver los informes</p>';
}

async function renderPublicadores() {
    try {
        showLoading();
        const data = await apiRequest('/publicador/all');
        hideLoading();

        if (data && data.data) {
            currentPublicadores = data.data;
            document.getElementById('filterPublicador').innerHTML =
                data.data.map(publicador => `<option value="${publicador.id}">${publicador.apellidos}, ${publicador.nombre}</option>`).join('');
        } else {
            document.getElementById('filterPublicador').innerHTML =
                '<option value="">No hay publicadores</option>';
        }
    } catch (error) {
        hideLoading();
    }
}

async function loadInformes(anio = '', idPublicador = '') {
    try {
        showLoading();
        const endpoint = `/informe/${idPublicador}/${anio}`;
        const data = await apiRequest(endpoint);
        hideLoading();

        if (data && data.data) {
            currentInformes = data.data;
            renderInformesTable(data.data);
        } else {
            document.getElementById('informesTableContainer').innerHTML =
                '<p class="text-center text-muted">No se encontraron informes</p>';
        }
    } catch (error) {
        hideLoading();
        document.getElementById('informesTableContainer').innerHTML =
            '<div class="alert alert-error">Error al cargar informes</div>';
    }
}

function renderInformesTable(informes) {
    const container = document.getElementById('informesTableContainer');

    if (informes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay informes que coincidan con los filtros</p>';
        return;
    }

    const html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Publicador</th>
                        <th>Tipo</th>
                        <th>Predicó</th>
                        <th>Horas</th>
                        <th>Cursos</th>
                        <th>Estatus</th>
                        ${hasPermission('admin') ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${informes.map(i => `
                        <tr>
                            <td data-label="Mes">${i.mes ? dayjs(i.mes).format('YYYY-MM') : ''}</td>
                            <td data-label="Publicador">${i.publicador || ''}</td>
                            <td data-label="Tipo">${i.tipo_publicador || ''}</td>
                            <td data-label="Predicó">${i.predico_en_el_mes ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-error">No</span>'}</td>
                            <td data-label="Horas">${i.horas || 0}</td>
                            <td data-label="Cursos">${i.cursos_biblicos || 0}</td>
                            <td data-label="Estatus">
                                ${i.Estatus === 'Activo'
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-warning">Inactivo</span>'}
                            </td>
                            ${hasPermission('admin') ? `
                                <td data-label="Acciones">
                                    <div class="flex gap-sm">
                                        <button class="btn btn-sm btn-secondary" onclick="window.editInforme(${i.id})">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.deleteInforme(${i.id})">Eliminar</button>
                                    </div>
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function showInformeForm(informe = null) {
    const modal = document.getElementById('informeFormModal');
    const isEdit = informe !== null;

    let mesValue = '';
    if (informe && informe.mes) {
        const d = dayjs(informe.mes);
        mesValue = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`;
    }

    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? 'Editar' : 'Agregar'} Informe</h3>
                    <button class="modal-close" id="closeFormModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="informeForm">
                        <div class="form-group">
                            <label class="form-label">Mes</label>
                            <input type="month" class="form-input" name="mes" value="${mesValue}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Publicador</label>
                            <select class="form-select" name="id_publicador" required>
                                <option value="">Seleccionar publicador</option>
                                ${currentPublicadores.map(publicador => `<option value="${publicador.id}" ${informe?.id_publicador == publicador.id ? 'selected' : ''}>${publicador.apellidos}, ${publicador.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de publicador</label>
                            <select class="form-select" name="id_tipo_publicador" required>
                                <option value="1" ${informe?.id_tipo_publicador == 1 ? 'selected' : ''}>Publicador</option>
                                <option value="2" ${informe?.id_tipo_publicador == 2 ? 'selected' : ''}>Precursor Regular</option>
                                <option value="3" ${informe?.id_tipo_publicador == 3 ? 'selected' : ''}>Precursor Auxiliar</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">¿Predicó en el mes?</label>
                            <select class="form-select" name="predico_en_el_mes" required>
                                <option value="1" ${informe?.predico_en_el_mes == 1 ? 'selected' : ''}>Sí</option>
                                <option value="0" ${informe?.predico_en_el_mes == 0 ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2">
                            <div class="form-group">
                                <label class="form-label">Horas</label>
                                <input type="number" class="form-input" name="horas" min="0" value="${informe?.horas || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Cursos bíblicos</label>
                                <input type="number" class="form-input" name="cursos_biblicos" min="0" value="${informe?.cursos_biblicos || 0}">
                            </div>
                        </div>
                        <div class="flex justify-end gap-sm mt-lg">
                            <button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar' : 'Guardar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('closeFormModal').addEventListener('click', () => modal.innerHTML = '');
    document.getElementById('cancelFormBtn').addEventListener('click', () => modal.innerHTML = '');

    document.getElementById('informeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert to proper types
        data.mes = dayjs(data.mes).format('YYYY-MM-01');
        data.id_publicador = parseInt(data.id_publicador);
        data.id_tipo_publicador = parseInt(data.id_tipo_publicador);
        data.predico_en_el_mes = parseInt(data.predico_en_el_mes);
        data.horas = parseInt(data.horas) || 0;
        data.cursos_biblicos = parseInt(data.cursos_biblicos) || 0;

        await saveInforme(data, informe?.id);
    });
}

async function saveInforme(data, id = null) {
    try {
        showLoading();

        let result;
        if (id) {
            result = await apiRequest(`/informe/${id}`, {
                method: 'PUT',
                body: data
            });
        } else {
            result = await apiRequest('/informe/add', {
                method: 'POST',
                body: data
            });
        }

        hideLoading();

        if (result && result.success) {
            showToast(id ? 'Informe actualizado' : 'Informe agregado', 'success');
            document.getElementById('informeFormModal').innerHTML = '';
            applyFilters();
        }
    } catch (error) {
        hideLoading();
    }
}

async function deleteInformeById(id) {
    try {
        showLoading();
        const result = await apiRequest(`/informe/${id}`, {
            method: 'DELETE'
        });
        hideLoading();

        if (result && result.success) {
            showToast('Informe eliminado', 'success');
            applyFilters();
        }
    } catch (error) {
        hideLoading();
    }
}

window.editInforme = (id) => {
    const informe = currentInformes.find(i => i.id === id);
    if (informe) {
        showInformeForm(informe);
    }
};

window.deleteInforme = (id) => {
    showConfirm('¿Estás seguro de que deseas eliminar este informe?', () => {
        deleteInformeById(id);
    });
};

// ============================================
// BULK EDITOR FUNCTIONS
// ============================================

async function loadGroups() {
    try {
        const data = await apiRequest('/publicador/all');
        if (data && data.data) {
            const grupos = [...new Set(data.data.map(p => p.grupo).filter(g => g))];
            grupos.sort();

            const select = document.getElementById('bulkGroup');
            select.innerHTML = grupos.map(g => `<option value="${g}">${g}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

async function loadBulkEditor() {
    const month = document.getElementById('bulkMonth').value;
    const group = document.getElementById('bulkGroup').value;

    if (!month || !group) {
        showToast('Por favor selecciona mes y grupo', 'warning');
        return;
    }

    selectedMonth = month;
    selectedGroup = group;

    try {
        showLoading();

        // Load publicadores from selected group
        const pubData = await apiRequest(`/publicador/grupo/${group}`);
        const publicadores = pubData.data;

        if (publicadores.length === 0) {
            hideLoading();
            showToast('No hay publicadores en este grupo', 'warning');
            return;
        }

        // Load existing informes for this month
        const monthDate = dayjs(month + '-01');
        let year = monthDate.year();
        if (monthDate.month() >= 8) {
            year++;
        }
        const existingInformes = {};

        // Load informes for each publicador
        for (const pub of publicadores) {
            try {
                const informeData = await apiRequest(`/informe/${pub.id}/${year}/${month.substring(5, 7)}`);
                if (informeData && informeData.data) {
                    const informe = informeData.data.find(i => {
                        const iMonth = dayjs(i.mes).format('YYYY-MM');
                        return iMonth == month;
                    });
                    if (informe) {
                        existingInformes[pub.id] = informe;
                    }
                }
            } catch (e) {
                // No informes for this publicador
            }
        }

        hideLoading();

        // Initialize bulk data
        bulkInformesData = publicadores.sort((a, b) => (parseInt(a.id_tipo_publicador % 2) - parseInt(b.id_tipo_publicador % 2)) * 100 + `${a.apellidos}, ${a.nombre}`.localeCompare(`${b.apellidos}, ${b.nombre}`)).map(pub => {
            const existing = existingInformes[pub.id];
            return {
                id_publicador: pub.id,
                nombre: `${pub.apellidos}, ${pub.nombre}`,
                telefono: pub.telefono_movil,
                mes: month + '-01',
                predico_en_el_mes: existing ? existing.predico_en_el_mes : 0,
                horas: existing ? existing.horas : 0,
                cursos_biblicos: existing ? existing.cursos_biblicos : 0,
                id_tipo_publicador: existing ? existing.id_tipo_publicador : pub.id_tipo_publicador || 1,
                notas: existing ? existing.notas : ''
            };
        });

        renderBulkEditorTable();

    } catch (error) {
        hideLoading();
        showToast('Error al cargar datos', 'error');
        console.error(error);
    }
}

function renderBulkEditorTable() {
    const container = document.getElementById('bulkEditorContainer');
    const nombreMes = dayjs(selectedMonth + "-01").format('MMMM YYYY');
    if (bulkInformesData.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay datos para mostrar</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-container" style="max-height: 600px; overflow-y: auto;">
            <table class="table">
                <thead style="position: sticky; top: 0; background: var(--bg-primary); z-index: 10;">
                    <tr>
                        <th style="min-width: 150px;">Publicador</th>
                        <th style="width: 100px;">Enviar WhatsApp</th>
                        <th style="width: 100px;">Participación en el ministerio</th>
                        <th style="width: 100px;">Cursos bíblicos</th>
                        <th style="width: 100px;">Precursor auxiliar</th>
                        <th style="width: 100px;">Horas</th>
                        <th style="min-width: 150px;">Notas</th>
                    </tr>
                </thead>
                <tbody>
                    ${bulkInformesData.map((informe, index) => `
                        ${index == 0 && informe.id_tipo_publicador == 2 ? `<tr class="header"><th colspan="7" style="background-color: var(--bg-primary); color: var(--text-primary); text-align: center; font-weight: bold; font-size: var(--font-size-lg);">Precursores regulares</th></tr>` : ''}
                        ${(index == 0 && informe.id_tipo_publicador != 2) || (index > 0 && informe.id_tipo_publicador != 2 && bulkInformesData[index - 1].id_tipo_publicador == 2) ? `<tr class="header"><th colspan="7" style="background-color: var(--bg-primary); color: var(--text-primary); text-align: center; font-weight: bold; font-size: var(--font-size-lg);">Publicadores</th></tr>` : ''}
                        <tr>
                            <td data-label="Publicador"><strong>${informe.nombre}</strong></td>
                            <td data-label="Enviar WhatsApp" style="text-align: center;">
                                <a id="whatsapp_${index}" style="display: ${informe.predico_en_el_mes || !informe.telefono ? 'none' : 'block'};" href="https://wa.me/${informe.telefono}?text=Hola%2C%20buen%20d%C3%ADa!%20Me%20puede%20mandar%20su%20informe%20de%20${nombreMes}%2C%20por%20favor%3F%20Saludos!" target="_blank">${informe.telefono}</a>
                            </td>
                            <td data-label="Participación en el ministerio" style="text-align: center;">
                                <label class="switch">
                                    <input type="checkbox"
                                        id="predico_${index}" 
                                        ${informe.predico_en_el_mes ? 'checked' : ''}
                                        onchange="window.updateBulkInforme(${index}, 'predico_en_el_mes', this.checked ? 1 : 0); document.getElementById('whatsapp_${index}').style.display = this.checked ? 'none' : 'block'"/>
                                    <span class="slider round"></span>
                                </label>
                            </td>
                            <td data-label="Cursos bíblicos" style="text-align: center;">
                                <input type="number" 
                                    class="form-input" 
                                    value="${informe.cursos_biblicos}" 
                                    min="0"
                                    onchange="window.updateBulkInforme(${index}, 'cursos_biblicos', parseInt(this.value) || 0)"
                                    style="padding: 0.5rem;">
                            </td>
                            <td data-label="Precursor auxiliar" style="text-align: center;">
                                <label class="switch">
                                    <input type="checkbox"
                                        id="id_tipo_publicador_${index}" 
                                        ${informe.id_tipo_publicador == 2 ? 'disabled' : ''}
                                        ${informe.id_tipo_publicador == 3 ? 'checked' : ''}
                                        onchange="window.updateBulkInforme(${index}, 'id_tipo_publicador', this.checked ? 3 : 1)"/>
                                    <span class="slider round"></span>
                                </label>
                            </td>
                            <td data-label="Horas" style="text-align: center;">
                                <input type="number" 
                                    class="form-input" 
                                    value="${informe.horas}" 
                                    min="0"
                                    onchange="window.updateBulkInforme(${index}, 'horas', parseInt(this.value) || 0)"
                                    style="padding: 0.5rem;">
                            </td>
                            <td data-label="Notas" style="text-align: center;">
                                <input type="text" 
                                    class="form-input" 
                                    value="${informe.notas || ''}" 
                                    onchange="window.updateBulkInforme(${index}, 'notas', this.value)"
                                    style="padding: 0.5rem;">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="flex justify-end gap-sm mt-lg">
            <button class="btn btn-secondary" onclick="window.cancelBulkEdit()">Cancelar</button>
            <button class="btn btn-primary" onclick="window.saveBulkInformes()">
                💾 Guardar Todos (${bulkInformesData.length} informes)
            </button>
        </div>
    `;
}

window.updateBulkInforme = (index, field, value) => {
    if (bulkInformesData[index]) {
        bulkInformesData[index][field] = value;
    }
};

window.cancelBulkEdit = () => {
    bulkInformesData = [];
    document.getElementById('bulkEditorContainer').innerHTML = '';
    document.getElementById('bulkMonth').value = '';
    document.getElementById('bulkGroup').value = '';
};

window.saveBulkInformes = async () => {
    if (bulkInformesData.length === 0) {
        showToast('No hay datos para guardar', 'warning');
        return;
    }

    try {
        showLoading();

        // Prepare data - remove nombre field and ensure proper format
        const dataToSend = bulkInformesData.map(informe => ({
            id_publicador: informe.id_publicador,
            mes: informe.mes,
            predico_en_el_mes: informe.predico_en_el_mes,
            horas: informe.horas,
            cursos_biblicos: informe.cursos_biblicos,
            id_tipo_publicador: informe.id_tipo_publicador,
            notas: informe.notas
        }));

        const result = await apiRequest('/informe/bulk', {
            method: 'POST',
            body: dataToSend
        });

        hideLoading();

        if (result && result.success) {
            showToast(`✅ ${bulkInformesData.length} informes guardados exitosamente`, 'success');
            window.cancelBulkEdit();
        }
    } catch (error) {
        hideLoading();
        showToast('Error al guardar informes', 'error');
        console.error(error);
    }
};
