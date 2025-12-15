// ============================================
// ASISTENCIAS MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm } from '../app.js';
import { hasPermission } from './auth.js';

let currentAsistencias = [];

export async function renderAsistencias(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Asistencias</h1>
            <p class="page-description">Registro de asistencia a las reuniones</p>
        </div>
        
        ${hasPermission('admin') ? `
            <div class="flex justify-between items-center mb-lg">
                <button class="btn btn-primary" id="addAsistenciaBtn">+ Registrar Asistencia</button>
            </div>
        ` : ''}
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Registro de Asistencias</h3>
            </div>
            <div class="card-body">
                <div id="asistenciasTableContainer">
                    <div class="flex justify-center">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="asistenciaFormModal"></div>
    `;

    const addBtn = document.getElementById('addAsistenciaBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showAsistenciaForm());
    }

    await loadAsistencias();
}

async function loadAsistencias() {
    try {
        showLoading();
        const data = await apiRequest('/asistencias/all');
        hideLoading();

        if (data && data.data) {
            currentAsistencias = data.data;
            renderAsistenciasTable(data.data);
        } else {
            document.getElementById('asistenciasTableContainer').innerHTML =
                '<p class="text-center text-muted">No se encontraron registros de asistencia</p>';
        }
    } catch (error) {
        hideLoading();
        document.getElementById('asistenciasTableContainer').innerHTML =
            '<div class="alert alert-error">Error al cargar asistencias</div>';
    }
}

function renderAsistenciasTable(asistencias) {
    const container = document.getElementById('asistenciasTableContainer');

    if (asistencias.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay registros de asistencia</p>';
        return;
    }

    const html = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Asistentes</th>
                        <th>Día</th>
                        <th>Notas</th>
                        ${hasPermission('admin') ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${asistencias.map(a => {
        const fecha = dayjs(a.fecha).toDate();
        const diaSemana = fecha.toLocaleDateString('es-MX', { weekday: 'long' });
        const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;

        return `
                        <tr>
                            <td>${a.id}</td>
                            <td>${dayjs(fecha).format('YYYY-MM-DD')}</td>
                            <td><strong>${a.asistentes || ''}</strong></td>
                            <td><span class="badge ${esFinde ? 'badge-info' : 'badge-success'}">${diaSemana}</span></td>
                            <td>${a.notas || ''}</td>
                            ${hasPermission('admin') ? `
                                <td>
                                    <div class="flex gap-sm">
                                        <button class="btn btn-sm btn-secondary" onclick="window.editAsistencia(${a.id})">Editar</button>
                                        <button class="btn btn-sm btn-danger" onclick="window.deleteAsistencia(${a.id})">Eliminar</button>
                                    </div>
                                </td>
                            ` : ''}
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

function showAsistenciaForm(asistencia = null) {
    const modal = document.getElementById('asistenciaFormModal');
    const isEdit = asistencia !== null;

    // Format date for input (YYYY-MM-DD)
    let fechaValue = dayjs().format('YYYY-MM-DD');
    if (asistencia && asistencia.fecha) {
        fechaValue = dayjs(asistencia.fecha).format('YYYY-MM-DD');
    }

    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${isEdit ? 'Editar' : 'Registrar'} Asistencia</h3>
                    <button class="modal-close" id="closeFormModal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="asistenciaForm">
                        <div class="form-group">
                            <label class="form-label">Fecha</label>
                            <input type="date" class="form-input" name="fecha" value="${fechaValue}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Número de Asistentes</label>
                            <input type="number" class="form-input" name="asistentes" min="0" value="${asistencia?.asistentes || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notas</label>
                            <textarea class="form-input" name="notas" rows="3">${asistencia?.notas || ''}</textarea>
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

    document.getElementById('asistenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert asistentes to number
        data.asistentes = parseInt(data.asistentes);
        data.fecha = dayjs(data.fecha).format('YYYY-MM-DD');

        await saveAsistencia(data, asistencia?.id);
    });
}

async function saveAsistencia(data, id = null) {
    try {
        showLoading();

        let result;
        if (id) {
            result = await apiRequest(`/asistencias/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            result = await apiRequest('/asistencias/add', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        hideLoading();

        if (result && result.success) {
            showToast(id ? 'Asistencia actualizada' : 'Asistencia registrada', 'success');
            document.getElementById('asistenciaFormModal').innerHTML = '';
            await loadAsistencias();
        }
    } catch (error) {
        hideLoading();
    }
}

async function deleteAsistenciaById(id) {
    try {
        showLoading();
        const result = await apiRequest(`/asistencias/${id}`, {
            method: 'DELETE'
        });
        hideLoading();

        if (result && result.success) {
            showToast('Asistencia eliminada', 'success');
            await loadAsistencias();
        }
    } catch (error) {
        hideLoading();
    }
}

window.editAsistencia = (id) => {
    const asistencia = currentAsistencias.find(a => a.id === id);
    if (asistencia) {
        showAsistenciaForm(asistencia);
    }
};

window.deleteAsistencia = (id) => {
    showConfirm('¿Estás seguro de que deseas eliminar este registro?', () => {
        deleteAsistenciaById(id);
    });
};
