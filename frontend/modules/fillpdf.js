// ============================================
// FILLPDF MODULE
// ============================================

import { getToken } from './auth.js';
import { API_BASE_URL, apiRequest, showToast, showLoading, hideLoading } from '../app.js';

export async function renderFillPDF(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Generación de PDFs</h1>
            <p class="page-description">Genera reportes S21 y S88 en formato PDF</p>
        </div>
        
        <div class="grid grid-cols-1 gap-xl">
            <!-- S21 TOTALES -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Reporte S-21 Totales</h3>
                    <p class="card-subtitle">Genera S-21 para todos los publicadores de un tipo específico</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-lg" style="max-width: 600px;">
                        <div class="form-group">
                            <label class="form-label">Año</label>
                            <input type="number" class="form-input" id="s21TotalesYear" min="2020" max="2030" placeholder="2024">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de Publicador</label>
                            <select class="form-select" id="s21TotalesTipo">
                                <option value="">Cargando...</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary" id="generateS21TotalesBtn">
                        <span>📄</span> Generar S-21 Totales
                    </button>
                </div>
            </div>

            <!-- S21 INDIVIDUAL -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Reporte S-21 Individual</h3>
                    <p class="card-subtitle">Genera S-21 para un publicador específico</p>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-lg" style="max-width: 600px;">
                        <div class="form-group">
                            <label class="form-label">Año</label>
                            <input type="number" class="form-input" id="s21IndividualYear" min="2020" max="2030" placeholder="2024">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Publicador</label>
                            <select class="form-select" id="s21IndividualPublicador">
                                <option value="">Cargando...</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary" id="generateS21IndividualBtn">
                        <span>📄</span> Generar S-21 Individual
                    </button>
                </div>
            </div>

            <!-- S88 -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Reporte S-88</h3>
                    <p class="card-subtitle">Genera reporte de privilegios S-88</p>
                </div>
                <div class="card-body">
                    <div class="form-group" style="max-width: 300px;">
                        <label class="form-label">Año</label>
                        <input type="number" class="form-input" id="s88Year" min="2020" max="2030" placeholder="2024">
                    </div>
                    <button class="btn btn-primary" id="generateS88Btn">
                        <span>📄</span> Generar S-88
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup button handlers
    document.getElementById('generateS21TotalesBtn').addEventListener('click', generateS21Totales);
    document.getElementById('generateS21IndividualBtn').addEventListener('click', generateS21Individual);
    document.getElementById('generateS88Btn').addEventListener('click', generateS88);

    // Load data for selects
    await loadTiposPublicador();
    await loadPublicadores();
}

// ============================================
// LOAD DATA FOR SELECTS
// ============================================

async function loadTiposPublicador() {
    const select = document.getElementById('s21TotalesTipo');

    try {
        const response = await fetch(`${API_BASE_URL}/secretario/tipos-publicador`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (data && data.success && data.data) {
            select.innerHTML = '<option value="">Todos</option>' +
                data.data.map(tipo => `<option value="${tipo.id}">${tipo.descripcion}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Error al cargar tipos</option>';
        }
    } catch (error) {
        console.error('Error loading tipos:', error);
        select.innerHTML = '<option value="">Error al cargar tipos</option>';
    }
}

async function loadPublicadores() {
    const select = document.getElementById('s21IndividualPublicador');

    try {
        const data = await apiRequest('/publicador/all');

        if (data && data.success && data.data) {
            select.innerHTML = '<option value="">Todos</option>' +
                data.data.map(pub => `<option value="${pub.id}">${pub.nombre} ${pub.apellidos}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Error al cargar publicadores</option>';
        }
    } catch (error) {
        console.error('Error loading publicadores:', error);
        select.innerHTML = '<option value="">Error al cargar publicadores</option>';
    }
}

// ============================================
// PDF DOWNLOAD HELPER
// ============================================

async function downloadFile(endpoint, params, filename = 'reporte.pdf') {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(params)
        });
        hideLoading();

        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.error || 'Error al generar el PDF', 'error');
            return;
        }
        console.log(response.headers.get('Content-Disposition'));
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Archivo generado y descargado exitosamente', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error downloading PDF:', error);
        showToast('Error al descargar el PDF: ' + error.message, 'error');
    }
}

async function downloadPDFGet(endpoint, filename = 'reporte.pdf') {
    try {
        showLoading();

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        hideLoading();

        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.error || 'Error al generar el PDF', 'error');
            return;
        }

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('PDF generado y descargado exitosamente', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error downloading PDF:', error);
        showToast('Error al descargar el PDF: ' + error.message, 'error');
    }
}

// ============================================
// GENERATE FUNCTIONS
// ============================================

async function generateS21Totales() {
    const year = document.getElementById('s21TotalesYear').value;
    const tipoId = document.getElementById('s21TotalesTipo').value;
    const tipoName = document.getElementById('s21TotalesTipo').options[document.getElementById('s21TotalesTipo').selectedIndex].text;

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    await downloadFile('/fillpdf/get-s21-totales', {
        anio: parseInt(year),
        id_tipo_publicador: tipoId && parseInt(tipoId)
    }, `S21_Totales_${year} - ${tipoName}.${tipoId ? 'pdf' : 'zip'}`);
}

async function generateS21Individual() {
    const year = document.getElementById('s21IndividualYear').value;
    const publicadorId = document.getElementById('s21IndividualPublicador').value;
    const publicadorName = document.getElementById('s21IndividualPublicador').options[document.getElementById('s21IndividualPublicador').selectedIndex].text;

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    await downloadFile('/fillpdf/get-s21', {
        anio: parseInt(year),
        id_publicador: publicadorId && parseInt(publicadorId)
    }, `S21_${year} - ${publicadorName}.${publicadorId ? 'pdf' : 'zip'}`);
}

async function generateS88() {
    const year = document.getElementById('s88Year').value;

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }

    await downloadPDFGet(`/fillpdf/get-s88/${year}`, `S88_${year}.pdf`);
}
