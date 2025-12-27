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

let editingPublicadorId = null; // Track which publicador is being edited

function renderPublicadoresTable(publicadores) {
    const container = document.getElementById('publicadoresTableContainer');

    if (publicadores.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay publicadores registrados</p>';
        return;
    }

    const isAdmin = hasPermission('admin');

    const html = `
        <div class="table-container" style="max-height: 80vh; overflow-y: auto;">
            <table class="table">
                <thead style="position: sticky; top: 0; background: var(--bg-primary); z-index: 10;">
                    <tr>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>F. Nac.</th>
                        <th>F. Baut.</th>
                        <th>Grupo</th>
                        <th>Sup</th>
                        <th>Sexo</th>
                        <th>Tipo</th>
                        <th>Priv.</th>
                        <th>Ung.</th>
                        <th>Calle</th>
                        <th>Núm</th>
                        <th>Colonia</th>
                        <th>Tel. Fijo</th>
                        <th>Tel. Móvil</th>
                        <th>Contacto E.</th>
                        <th>Tel. E.</th>
                        <th>Email E.</th>
                        ${isAdmin ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${publicadores.map((p, index) =>
        `<tr id="pub-row-${p.id}">${renderPublicador(p, index, isAdmin)}</tr>`
    ).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// Enter edit mode for a specific publicador
window.editPublicadorInline = (id, index) => {
    editingPublicadorId = id;
    const p = currentPublicadores[index];

    document.getElementById('pub-row-' + p.id).innerHTML = `
        <td data-label="Nombre">
            <input type="text" class="form-input" value="${p.nombre || ''}" onchange="window.updatePublicador(${index}, 'nombre', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Apellidos">
            <input type="text" class="form-input" value="${p.apellidos || ''}" onchange="window.updatePublicador(${index}, 'apellidos', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="F. Nac.">
            <input type="date" class="form-input" value="${p.fecha_nacimiento || ''}" onchange="window.updatePublicador(${index}, 'fecha_nacimiento', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="F. Baut.">
            <input type="date" class="form-input" value="${p.fecha_bautismo || ''}" onchange="window.updatePublicador(${index}, 'fecha_bautismo', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Grupo">
            <input type="number" class="form-input" value="${p.grupo || ''}" onchange="window.updatePublicador(${index}, 'grupo', this.value)" style="padding: 0.3rem; width: 60px;">
        </td>
        <td data-label="Sup">
            <select class="form-select" onchange="window.updatePublicador(${index}, 'sup_grupo', this.value)" style="padding: 0.3rem;">
                <option value="">-</option>
                <option value="1" ${p.sup_grupo == 1 ? 'selected' : ''}>Sup</option>
                <option value="2" ${p.sup_grupo == 2 ? 'selected' : ''}>Aux</option>
            </select>
        </td>
        <td data-label="Sexo">
            <select class="form-select" onchange="window.updatePublicador(${index}, 'sexo', this.value)" style="padding: 0.3rem;">
                <option value="H" ${p.sexo == 'H' ? 'selected' : ''}>H</option>
                <option value="M" ${p.sexo == 'M' ? 'selected' : ''}>M</option>
            </select>
        </td>
        <td data-label="Tipo">
            <select class="form-select" onchange="window.updatePublicador(${index}, 'id_tipo_publicador', this.value)" style="padding: 0.3rem;">
                <option value="1" ${p.id_tipo_publicador == 1 ? 'selected' : ''}>Pub</option>
                <option value="2" ${p.id_tipo_publicador == 2 ? 'selected' : ''}>PR</option>
                <option value="3" ${p.id_tipo_publicador == 3 ? 'selected' : ''}>PA</option>
            </select>
        </td>
        <td data-label="Priv.">
            <select class="form-select" onchange="window.updatePublicador(${index}, 'id_privilegio', this.value)" style="padding: 0.3rem;">
                <option value="">-</option>
                <option value="1" ${p.id_privilegio == 1 ? 'selected' : ''}>Anc</option>
                <option value="2" ${p.id_privilegio == 2 ? 'selected' : ''}>SM</option>
            </select>
        </td>
        <td data-label="Ung.">
            <label class="switch">
                <input type="checkbox" ${p.ungido ? 'checked' : ''} onchange="window.updatePublicador(${index}, 'ungido', this.checked ? 1 : 0)">
                <span class="slider round"></span>
            </label>
        </td>
        <td data-label="Calle">
            <input type="text" class="form-input" value="${p.calle || ''}" onchange="window.updatePublicador(${index}, 'calle', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Núm">
            <input type="text" class="form-input" value="${p.num || ''}" onchange="window.updatePublicador(${index}, 'num', this.value)" style="padding: 0.3rem; width: 60px;">
        </td>
        <td data-label="Colonia">
            <input type="text" class="form-input" value="${p.colonia || ''}" onchange="window.updatePublicador(${index}, 'colonia', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Tel. Fijo">
            <input type="tel" class="form-input" value="${p.telefono_fijo || ''}" onchange="window.updatePublicador(${index}, 'telefono_fijo', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Tel. Móvil">
            <input type="tel" class="form-input" value="${p.telefono_movil || ''}" onchange="window.updatePublicador(${index}, 'telefono_movil', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Contacto E.">
            <input type="text" class="form-input" value="${p.contacto_emergencia || ''}" onchange="window.updatePublicador(${index}, 'contacto_emergencia', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Tel. E.">
            <input type="tel" class="form-input" value="${p.tel_contacto_emergencia || ''}" onchange="window.updatePublicador(${index}, 'tel_contacto_emergencia', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Email E.">
            <input type="email" class="form-input" value="${p.correo_contacto_emergencia || ''}" onchange="window.updatePublicador(${index}, 'correo_contacto_emergencia', this.value)" style="padding: 0.3rem;">
        </td>
        <td data-label="Acciones">
            <div class="flex gap-sm">
                <button class="btn btn-sm btn-success" onclick="window.savePublicadorInline(${index})" title="Guardar cambios">💾</button>
                <button class="btn btn-sm btn-secondary" onclick="window.cancelEditPublicador(${index})" title="Cancelar">✖️</button>
            </div>
        </td>
    `;
}
// Cancel editing and return to read mode
window.cancelEditPublicador = (index) => {
    const p = currentPublicadores[index];
    document.getElementById('pub-row-' + p.id).innerHTML = renderPublicador(p, index);
    editingPublicadorId = null;
};

const renderPublicador = (p, index, isAdmin) => {
    if (isAdmin == undefined) {
        isAdmin = hasPermission('admin');
    }
    return `
        <td data-label="Nombre">${p.nombre || ''}</td>
        <td data-label="Apellidos">${p.apellidos || ''}</td>
        <td data-label="F. Nac.">${p.fecha_nacimiento || ''}</td>
        <td data-label="F. Baut.">${p.fecha_bautismo || ''}</td>
        <td data-label="Grupo">${p.grupo || ''}</td>
        <td data-label="Sup">${p.sup_grupo || ''}</td>
        <td data-label="Sexo">${p.sexo || ''}</td>
        <td data-label="Tipo">${p.tipo_publicador || ''}</td>
        <td data-label="Privilegio">${p.privilegio || ''}</td>
        <td data-label="Ungido">${p.ungido ? '✓' : ''}</td>
        <td data-label="Calle">${p.calle || ''}</td>
        <td data-label="Núm">${p.num || ''}</td>
        <td data-label="Colonia">${p.colonia || ''}</td>
        <td data-label="Tel. Fijo">${p.telefono_fijo || ''}</td>
        <td data-label="Tel. Móvil">${p.telefono_movil || ''}</td>
        <td data-label="Contacto E.">${p.contacto_emergencia || ''}</td>
        <td data-label="Tel. E.">${p.tel_contacto_emergencia || ''}</td>
        <td data-label="Email E.">${p.correo_contacto_emergencia || ''}</td>
        ${isAdmin ? `<td data-label="Acciones">
            <div class="flex gap-sm">
                <button class="btn btn-sm btn-secondary" onclick="window.editPublicadorInline(${p.id}, ${index})" title="Editar">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="window.deletePublicador(${p.id})" title="Eliminar">🗑️</button>
            </div>
        </td>` : ''}
    `;
};
// Update publicador field in memory
window.updatePublicador = (index, field, value) => {
    if (currentPublicadores[index]) {
        // Convert to appropriate type
        if (field === 'id_tipo_publicador' || field === 'id_privilegio' || field === 'ungido' || field === 'grupo') {
            currentPublicadores[index][field] = value ? parseInt(value) : null;
        } else {
            currentPublicadores[index][field] = value;
        }
    }
};

// Save individual publicador
window.savePublicadorInline = async (index) => {
    const publicador = currentPublicadores[index];
    if (!publicador) return;

    try {
        showLoading();
        const result = await apiRequest(`/publicador/${publicador.id}`, {
            method: 'PUT',
            body: publicador
        });
        hideLoading();

        if (result && result.success) {
            showToast('✅ Publicador actualizado', 'success');
            editingPublicadorId = null; // Exit edit mode
            await loadPublicadores(); // Reload fresh data
        }
    } catch (error) {
        hideLoading();
        showToast('Error al guardar', 'error');
    }
};

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
                            <label class="form-label">Fecha de Nacimiento</label>
                            <input type="date" class="form-input" name="fecha_nacimiento" value="${publicador?.fecha_nacimiento || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de Bautismo</label>
                            <input type="date" class="form-input" name="fecha_bautismo" value="${publicador?.fecha_bautismo || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Grupo</label>
                            <input type="number" class="form-input" name="grupo" value="${publicador?.grupo || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sup Grupo</label>
                            <select class="form-select" name="sup_grupo" required>
                                <option value="">Seleccione</option>
                                <option value="1" ${publicador?.sup_grupo == 1 ? 'selected' : ''}>Sup</option>
                                <option value="2" ${publicador?.sup_grupo == 2 ? 'selected' : ''}>Aux</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Sexo</label>
                            <select class="form-select" name="sexo" required>
                                <option value="H" ${publicador?.sexo == 'H' ? 'selected' : ''}>Masculino</option>
                                <option value="M" ${publicador?.sexo == 'M' ? 'selected' : ''}>Femenino</option>
                            </select>
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
                        <div class="form-group">
                            <label class="form-label">Ungido</label>
                            <label class="switch">
                                <input type="checkbox" name="ungido" ${publicador?.ungido ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Calle</label>
                            <input type="text" class="form-input" name="calle" value="${publicador?.calle || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Num</label>
                            <input type="text" class="form-input" name="num" value="${publicador?.num || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Colonia</label>
                            <input type="text" class="form-input" name="colonia" value="${publicador?.colonia || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefono Fijo</label>
                            <input type="tel" class="form-input" name="telefono_fijo" value="${publicador?.telefono_fijo || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefono Movil</label>
                            <input type="tel" class="form-input" name="telefono_movil" value="${publicador?.telefono_movil || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Contacto Emergencia</label>
                            <input type="text" class="form-input" name="contacto_emergencia" value="${publicador?.contacto_emergencia || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tel Contacto Emergencia</label>
                            <input type="tel" class="form-input" name="tel_contacto_emergencia" value="${publicador?.tel_contacto_emergencia || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Correo Contacto Emergencia</label>
                            <input type="email" class="form-input" name="correo_contacto_emergencia" value="${publicador?.correo_contacto_emergencia || ''}">
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
