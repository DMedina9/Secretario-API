// ============================================
// ASISTENCIAS MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm } from '../app.js';
import { hasPermission } from './auth.js';

let currentAsistencias = [];
let currentMonth = dayjs(); // State for the calendar view

export async function renderAsistencias(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Asistencias</h1>
            <p class="page-description">Registro de asistencia a las reuniones</p>
        </div>
        
        <div class="calendar-controls">
            <button class="btn btn-sm btn-secondary" id="prevMonthBtn">&lt; Anterior</button>
            <span class="calendar-month-title" id="currentMonthDisplay"></span>
            <button class="btn btn-sm btn-secondary" id="nextMonthBtn">Siguiente &gt;</button>
        </div>

        <div class="card">
            <div class="card-body">
                <div id="calendarContainer" class="calendar-grid">
                    <!-- Calendar will be populated here -->
                </div>
                <div id="asistenciasTableContainer" class="hidden">
                    <!-- Loading or fallback -->
                    <div class="flex justify-center">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="asistenciaFormModal"></div>
    `;

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentMonth = currentMonth.subtract(1, 'month');
        loadAsistencias();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentMonth = currentMonth.add(1, 'month');
        loadAsistencias();
    });

    await loadAsistencias();
}

async function loadAsistencias() {
    try {
        showLoading();
        updateMonthDisplay();

        // Fetch ALL records for simplicity, then filter client-side for the displayed month
        // Ideally the backend should support filtering by date range, but we work with what we have.
        // If /asistencias/all returns everything, filtering here is fine for now unless data is huge.
        const data = await apiRequest('/asistencias/all');
        hideLoading();

        if (data && data.data) {
            currentAsistencias = data.data;
            renderCalendar();
        } else {
            // If no data, still render the empty calendar
            currentAsistencias = [];
            renderCalendar();
        }
    } catch (error) {
        hideLoading();
        document.getElementById('calendarContainer').innerHTML =
            '<div class="alert alert-error">Error al cargar asistencias</div>';
    }
}

function updateMonthDisplay() {
    const display = document.getElementById('currentMonthDisplay');
    if (display) {
        // Capitalize first letter
        const text = currentMonth.format('MMMM YYYY');
        display.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    }
}

function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';

    // headers
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header-cell';
        header.textContent = day;
        container.appendChild(header);
    });

    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day(); // 0 (Sunday) to 6 (Saturday)
    const daysInMonth = currentMonth.daysInMonth();

    // Fill empty slots before start of month
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day-cell empty';
        container.appendChild(empty);
    }

    // Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        const date = currentMonth.date(i);
        const dateStr = date.format('YYYY-MM-DD');
        const asistencia = currentAsistencias.find(a => dayjs(a.fecha).format('YYYY-MM-DD') === dateStr);
        const isToday = date.isSame(dayjs(), 'day');

        const cell = document.createElement('div');
        cell.className = `calendar-day-cell ${isToday ? 'today' : ''}`;

        // Add existing attendance content if any
        let contentHtml = `<span class="calendar-date-number">${i}</span>`;
        if (asistencia) {
            const diaSemana = date.day();
            const esFinde = diaSemana === 0 || diaSemana === 6; // Sun or Sat
            contentHtml += `
                <div class="calendar-day-content">
                    <span class="attendance-badge ${esFinde ? 'weekend' : ''}">${asistencia.asistentes}</span>
                    ${asistencia.notas ? `<span class="day-notes-indicator" title="${asistencia.notas}">📝</span>` : ''}
                </div>
             `;
        }

        cell.innerHTML = contentHtml;
        cell.addEventListener('click', () => {
            // Pass date object or existing record
            if (asistencia) {
                if (hasPermission('admin')) {
                    showAsistenciaForm(asistencia);
                } else {
                    showToast('No tienes permisos para editar.', 'info');
                }
            } else {
                if (hasPermission('admin')) {
                    // Create new for this date
                    showAsistenciaForm({ fecha: dateStr });
                } else {
                    showToast('No tienes permisos para registrar.', 'info');
                }
            }
        });

        container.appendChild(cell);
    }
}

function showAsistenciaForm(asistencia = null) {
    const modal = document.getElementById('asistenciaFormModal');
    const isEdit = asistencia && asistencia.id;

    // Use passed date or today
    let fechaValue = asistencia && asistencia.fecha ? asistencia.fecha : dayjs().format('YYYY-MM-DD');

    // Determine title
    const title = isEdit ? 'Editar Asistencia' : 'Registrar Asistencia';

    modal.innerHTML = `
        <div class="modal-overlay active">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
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
                            <input type="number" class="form-input" name="asistentes" min="0" value="${asistencia?.asistentes || ''}" required autofocus>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notas</label>
                            <textarea class="form-input" name="notas" rows="3">${asistencia?.notas || ''}</textarea>
                        </div>
                        
                        ${isEdit ? `
                        <div class="flex justify-between items-center mt-lg border-t pt-md" style="border-color: rgba(255,255,255,0.1)">
                             <button type="button" class="btn btn-sm btn-danger" id="deleteAsistenciaBtn">Eliminar Registro</button>
                             <div class="flex gap-sm">
                                <button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Actualizar</button>
                             </div>
                        </div>
                        ` : `
                        <div class="flex justify-end gap-sm mt-lg">
                            <button type="button" class="btn btn-secondary" id="cancelFormBtn">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar</button>
                        </div>
                        `}
                    </form>
                </div>
            </div>
        </div>
    `;

    document.getElementById('closeFormModal').addEventListener('click', () => modal.innerHTML = '');
    document.getElementById('cancelFormBtn').addEventListener('click', () => modal.innerHTML = '');

    if (isEdit) {
        document.getElementById('deleteAsistenciaBtn').addEventListener('click', () => {
            showConfirm('¿Estás seguro de que deseas eliminar este registro?', () => {
                deleteAsistenciaById(asistencia.id);
                document.getElementById('asistenciaFormModal').innerHTML = ''; // Close modal
            });
        });
    }

    document.getElementById('asistenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert asistentes to number
        data.asistentes = parseInt(data.asistentes);
        data.fecha = dayjs(data.fecha).format('YYYY-MM-DD');

        await saveAsistencia(data, isEdit ? asistencia.id : null);
    });
}

async function saveAsistencia(data, id = null) {
    try {
        showLoading();

        let result;
        if (id) {
            result = await apiRequest(`/asistencias/${id}`, {
                method: 'PUT',
                body: data
            });
        } else {
            result = await apiRequest('/asistencias/add', {
                method: 'POST',
                body: data
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
