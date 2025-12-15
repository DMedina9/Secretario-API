// ============================================
// DASHBOARD MODULE
// ============================================

import { apiRequest, showToast } from '../app.js';
import { isAuthenticated } from './auth.js';

export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Sistema de Gestión Secretario</h1>
            <p class="page-description">Bienvenido al sistema de gestión para secretarios de congregación</p>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card">
                <div class="stat-value" id="statusValue">...</div>
                <div class="stat-label">Estado del Sistema</div>
            </div>
        </div>
        
        <div class="grid grid-cols-3">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Publicadores</h3>
                    <p class="card-subtitle">Gestiona la información de publicadores</p>
                </div>
                <div class="card-body">
                    <p>Administra el registro de publicadores, precursores y privilegios de servicio.</p>
                </div>
                <div class="card-footer">
                    <a href="#" data-page="publicadores" class="btn btn-primary">Ver Publicadores</a>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Asistencias</h3>
                    <p class="card-subtitle">Registro de asistencia a reuniones</p>
                </div>
                <div class="card-body">
                    <p>Lleva el control de la asistencia a las reuniones entre semana y fin de semana.</p>
                </div>
                <div class="card-footer">
                    <a href="#" data-page="asistencias" class="btn btn-primary">Ver Asistencias</a>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Informes</h3>
                    <p class="card-subtitle">Informes de predicación</p>
                </div>
                <div class="card-body">
                    <p>Gestiona los informes mensuales de predicación y cursos bíblicos.</p>
                </div>
                <div class="card-footer">
                    <a href="#" data-page="informes" class="btn btn-primary">Ver Informes</a>
                </div>
            </div>
        </div>
        
        ${isAuthenticated() ? `
            <div class="card mt-xl">
                <div class="card-header">
                    <h3 class="card-title">Servicios de Secretario</h3>
                    <p class="card-subtitle">Herramientas y reportes especiales</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2">
                        <div>
                            <h5>Reporte S-1</h5>
                            <p>Estadísticas mensuales de la congregación con subsecciones detalladas.</p>
                        </div>
                        <div>
                            <h5>Reporte S-3</h5>
                            <p>Registro anual de asistencia por semanas.</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="#" data-page="secretario" class="btn btn-primary">Ver Servicios</a>
                </div>
            </div>
        ` : `
            <div class="card mt-xl">
                <div class="card-body text-center">
                    <h3>Inicia sesión para acceder a todas las funcionalidades</h3>
                    <p class="text-muted">Gestiona publicadores, asistencias, informes y genera reportes especiales.</p>
                </div>
            </div>
        `}
    `;

    // Setup navigation links
    container.querySelectorAll('a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            // Import navigateTo dynamically to avoid circular dependency
            import('../app.js').then(({ navigateTo }) => navigateTo(page));
        });
    });

    // Load API status
    loadAPIStatus();
}

async function loadAPIStatus() {
    try {
        const data = await apiRequest('/status');
        const statusValue = document.getElementById('statusValue');

        if (data && data.status) {
            statusValue.textContent = data.status;
            statusValue.style.color = 'var(--color-success)';
        } else {
            statusValue.textContent = 'Desconectado';
            statusValue.style.color = 'var(--color-error)';
        }
    } catch (error) {
        const statusValue = document.getElementById('statusValue');
        statusValue.textContent = 'Error';
        statusValue.style.color = 'var(--color-error)';
    }
}
