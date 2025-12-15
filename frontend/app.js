// ============================================
// SECRETARIO-API WEB FRONTEND - MAIN APP
// ============================================

import { initAuth, isAuthenticated, getToken, logout } from './modules/auth.js';
import { renderDashboard } from './modules/dashboard.js';
import { renderPublicadores } from './modules/publicadores.js';
import { renderAsistencias } from './modules/asistencias.js';
import { renderInformes } from './modules/informes.js';
import { renderSecretario } from './modules/secretario.js';
import { renderFillPDF } from './modules/fillpdf.js';

// ============================================
// API CONFIGURATION
// ============================================
export const API_BASE_URL = 'https://secretario-api.onrender.com';

// ============================================
// API CLIENT
// ============================================
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        // Handle 401 Unauthorized
        if (response.status === 401) {
            logout();
            showToast('Sesión expirada. Por favor inicia sesión nuevamente.', 'error');
            navigateTo('dashboard');
            return null;
        }

        if (!response.ok && !data.success) {
            throw new Error(data.error || 'Error en la solicitud');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message || 'Error de conexión', 'error');
        throw error;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// LOADING STATE
// ============================================
export function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
}

export function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// ============================================
// ROUTER
// ============================================
const routes = {
    dashboard: renderDashboard,
    publicadores: renderPublicadores,
    asistencias: renderAsistencias,
    informes: renderInformes,
    secretario: renderSecretario,
    fillpdf: renderFillPDF
};

export function navigateTo(page) {
    const contentArea = document.getElementById('appContent');

    // Update active nav link
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });

    // Check authentication for protected routes
    if (page !== 'dashboard' && !isAuthenticated()) {
        showToast('Debes iniciar sesión para acceder a esta sección', 'warning');
        openAuthModal();
        return;
    }

    // Render the page
    if (routes[page]) {
        contentArea.innerHTML = '';
        contentArea.classList.add('fade-in');
        routes[page](contentArea);
    } else {
        contentArea.innerHTML = '<p>Página no encontrada</p>';
    }
}

// ============================================
// AUTH MODAL
// ============================================
export function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
}

export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

// ============================================
// CONFIRMATION DIALOG
// ============================================
export function showConfirm(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Confirmación</h3>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="card-footer" style="margin-top: var(--space-lg);">
                <button class="btn btn-secondary" id="cancelBtn">Cancelar</button>
                <button class="btn btn-danger" id="confirmBtn">Confirmar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#confirmBtn').addEventListener('click', () => {
        onConfirm();
        overlay.remove();
    });

    overlay.querySelector('#cancelBtn').addEventListener('click', () => {
        overlay.remove();
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize authentication
    initAuth();

    // Setup navigation
    document.querySelectorAll('.navbar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
        });
    });

    // Setup auth modal
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeAuthModalBtn = document.getElementById('closeAuthModal');

    loginBtn.addEventListener('click', openAuthModal);
    logoutBtn.addEventListener('click', () => {
        logout();
        navigateTo('dashboard');
    });

    closeAuthModalBtn.addEventListener('click', closeAuthModal);

    // Close modal on outside click
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            closeAuthModal();
        }
    });

    // Load initial page
    navigateTo('dashboard');
});
