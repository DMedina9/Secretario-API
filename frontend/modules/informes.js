// ============================================
// INFORMES MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm } from '../app.js';
import { hasPermission } from './auth.js';

let currentInformes = [];
let currentPublicadores = [];
let currentYear = new Date().getFullYear();
export async function renderInformes(container) {
    const mesData = await apiRequest('/secretario/mes-informe');
    const currentMonth = (mesData && mesData.data) ? new Date(mesData.data) : new Date();
    currentYear = currentMonth.getFullYear();
    if (currentMonth.getMonth() > 8) {
        currentYear++;
    }
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Informes de Predicación</h1>
            <p class="page-description">Gestión de informes mensuales de predicación</p>
        </div>
        
        <div class="card mb-lg">
            <div class="card-header">
                <h3 class="card-title">Filtros</h3>
            </div>
            <div class="card-body">
                <div class="grid grid-cols-3">
                    <div class="form-group">
                        <label class="form-label">Año de Servicio</label>
                        <input type="number" class="form-input" id="filterAnio" placeholder="${currentYear}" min="2020" max="2050">
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
        
        <div id="informeFormModal"></div>
    `;

    await renderPublicadores();

    // Setup filter buttons
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);

    const addBtn = document.getElementById('addInformeBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showInformeForm());
    }
}

async function applyFilters() {
    const anio = document.getElementById('filterAnio').value || currentYear;
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

async function loadInformes(anio = '', idPublicador = '', dir = 'DESC') {
    try {
        showLoading();
        const endpoint = `/informe/${anio}/${idPublicador}/${dir}`;
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
                            <td>${i.mes ? new Date(i.mes).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }) : ''}</td>
                            <td>${i.publicador || ''}</td>
                            <td>${i.tipo_publicador || ''}</td>
                            <td>${i.predico_en_el_mes ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-error">No</span>'}</td>
                            <td>${i.horas || 0}</td>
                            <td>${i.cursos_biblicos || 0}</td>
                            <td>
                                ${i.Estatus === 'Activo'
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-warning">Inactivo</span>'}
                            </td>
                            ${hasPermission('admin') ? `
                                <td>
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
        const d = new Date(informe.mes);
        mesValue = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
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
                            <input type="date" class="form-input" name="mes" value="${mesValue}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Publicador</label>
                            <select class="form-select" name="id_publicador" required>
                                <option value="">Seleccionar publicador</option>
                                ${currentPublicadores.map(publicador => `<option value="${publicador.id}" ${informe?.id_publicador == publicador.id ? 'selected' : ''}>${publicador.apellidos}, ${publicador.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">ID Tipo Publicador</label>
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
                                <label class="form-label">Cursos Bíblicos</label>
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
                body: JSON.stringify(data)
            });
        } else {
            result = await apiRequest('/informe/add', {
                method: 'POST',
                body: JSON.stringify(data)
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
