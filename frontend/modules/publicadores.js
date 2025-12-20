// ============================================
// PUBLICADORES MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm } from '../app.js';
import { hasPermission } from './auth.js';

let currentPublicadores = [];

export async function renderPublicadores(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Publicadores</h1>
            <p class="page-description">Gestión de publicadores de la congregación</p>
        </div>
        
        ${hasPermission('admin') ? `
            <div class="flex justify-between items-center mb-lg">
                <button class="btn btn-primary" id="addPublicadorBtn">+ Agregar Publicador</button>
                <button class="btn btn-primary" id="importPublicadorBtn">Importar Publicadores</button>
            </div>
        ` : ''}
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Lista de Publicadores</h3>
            </div>
            <div class="card-body">
                <div id="publicadoresTableContainer">
                    <div class="flex justify-center">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="publicadorFormModal"></div>
    `;

    // Setup add button
    const addBtn = document.getElementById('addPublicadorBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showPublicadorForm());
    }

    // Setup import button
    const importBtn = document.getElementById('importPublicadorBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => importPublicadores());
    }

    // Load publicadores
    await loadPublicadores();
}

async function loadPublicadores() {
    try {
        showLoading();
        const data = await apiRequest('/publicador/all');
        hideLoading();

        if (data && data.data) {
            currentPublicadores = data.data;
            renderPublicadoresTable(data.data);
        } else {
            document.getElementById('publicadoresTableContainer').innerHTML =
                '<p class="text-center text-muted">No se encontraron publicadores</p>';
        }
    } catch (error) {
        hideLoading();
        document.getElementById('publicadoresTableContainer').innerHTML =
            '<div class="alert alert-error">Error al cargar publicadores</div>';
    }
}

async function importPublicadores() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';
    fileInput.click();
    fileInput.addEventListener('change', async () => {
        if (!fileInput.files.length) {
            showToast('Por favor, selecciona un archivo', 'warning');
            return;
        }
        try {
            showLoading();
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const data = await apiRequest('/publicador/import', {
                method: 'POST',
                body: formData
            });
            hideLoading();
            console.log(data);
            if (data && data.data) {
                currentPublicadores = data.data;
                renderPublicadoresTable(data.data);
            } else {
                document.getElementById('publicadoresTableContainer').innerHTML =
                    '<p class="text-center text-muted">No se encontraron registros de publicadores</p>';
            }
        } catch (error) {
            hideLoading();
            document.getElementById('publicadoresTableContainer').innerHTML =
                '<div class="alert alert-error">Error al cargar publicadores</div>';
        }
    });
}

function renderPublicadoresTable(publicadores) {
    const container = document.getElementById('publicadoresTableContainer');

    if (publicadores.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay publicadores registrados</p>';
        return;
    }

    const html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Tipo</th>
                        <th>Privilegio</th>
                        ${hasPermission('admin') ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${publicadores.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.nombre || ''}</td>
                            <td>${p.apellidos || ''}</td>
                            <td><span class="badge badge-primary">${p.tipo_publicador || 'N/A'}</span></td>
                            <td>${p.privilegio || 'N/A'}</td>
                            ${hasPermission('admin') ? `
                                <td>
                                    <div class="flex gap-sm">
                                        <button class="btn btn-sm btn-secondary" onclick="window.editPublicador(${p.id})">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.deletePublicador(${p.id})">Eliminar</button>
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

function showPublicadorForm(publicador = null) {
    const modal = document.getElementById('publicadorFormModal');
    const isEdit = publicador !== null;

    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? 'Editar' : 'Agregar'} Publicador</h3>
                    <button class="modal-close" id="closeFormModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="publicadorForm">
                        <div class="form-group">
                            <label class="form-label">Nombre</label>
                            <input type="text" class="form-input" name="nombre" value="${publicador?.nombre || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Apellidos</label>
                            <input type="text" class="form-input" name="apellidos" value="${publicador?.apellidos || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de Publicador</label>
                            <select class="form-select" name="id_tipo_publicador" required>
                                <option value="1" ${publicador?.id_tipo_publicador == 1 ? 'selected' : ''}>Publicador</option>
                                <option value="2" ${publicador?.id_tipo_publicador == 2 ? 'selected' : ''}>Precursor Regular</option>
                                <option value="3" ${publicador?.id_tipo_publicador == 3 ? 'selected' : ''}>Precursor Auxiliar</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Privilegio</label>
                            <select class="form-select" name="id_privilegio">
                                <option value="">Ninguno</option>
                                <option value="1" ${publicador?.id_privilegio == 1 ? 'selected' : ''}>Anciano</option>
                                <option value="2" ${publicador?.id_privilegio == 2 ? 'selected' : ''}>Siervo Ministerial</option>
                            </select>
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

    document.getElementById('publicadorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert to numbers
        data.id_tipo_publicador = parseInt(data.id_tipo_publicador);
        if (data.id_privilegio) {
            data.id_privilegio = parseInt(data.id_privilegio);
        } else {
            delete data.id_privilegio;
        }

        await savePublicador(data, publicador?.id);
    });
}

async function savePublicador(data, id = null) {
    try {
        showLoading();

        let result;
        if (id) {
            // Update
            result = await apiRequest(`/publicador/${id}`, {
                method: 'PUT',
                body: data
            });
        } else {
            // Create
            result = await apiRequest('/publicador/add', {
                method: 'POST',
                body: data
            });
        }

        hideLoading();

        if (result && result.success) {
            showToast(id ? 'Publicador actualizado' : 'Publicador agregado', 'success');
            document.getElementById('publicadorFormModal').innerHTML = '';
            await loadPublicadores();
        }
    } catch (error) {
        hideLoading();
    }
}

async function deletePublicadorById(id) {
    try {
        showLoading();
        const result = await apiRequest(`/publicador/${id}`, {
            method: 'DELETE'
        });
        hideLoading();

        if (result && result.success) {
            showToast('Publicador eliminado', 'success');
            await loadPublicadores();
        }
    } catch (error) {
        hideLoading();
    }
}

// Global functions for button onclick handlers
window.editPublicador = (id) => {
    const publicador = currentPublicadores.find(p => p.id === id);
    if (publicador) {
        showPublicadorForm(publicador);
    }
};

window.deletePublicador = (id) => {
    showConfirm('¿Estás seguro de que deseas eliminar este publicador?', () => {
        deletePublicadorById(id);
    });
};
