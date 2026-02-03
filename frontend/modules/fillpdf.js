// ============================================
// FILLPDF MODULE
// ============================================

import { getToken } from './auth.js';
import { API_BASE_URL, apiRequest, showToast, showLoading, hideLoading, getAnioServicio } from '../app.js';

let publicadoresList = [];

export async function renderFillPDF(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Reportes en PDF</h1>
            <p class="page-description">Visualiza reportes S21 y S88 en formato PDF</p>
        </div>
        
        <div class="config-layout">
            <!-- Sidebar Navigation -->
            <aside class="config-sidebar">
                <nav class="config-nav">
                    <a href="#" data-section="visualizador" class="config-nav-item active">
                        <span class="config-nav-icon">🔍</span>
                        <span class="config-nav-text">Visualizador</span>
                    </a>
                    <a href="#" data-section="general" class="config-nav-item">
                        <span class="config-nav-icon">📑</span>
                        <span class="config-nav-text">Reporte General</span>
                    </a>
                </nav>
            </aside>
            
            <!-- Content Area -->
            <main class="config-content">
                <!-- Section: Visualizador de PDF -->
                <div id="section-visualizador" class="config-section active">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🔍 Visualizador de PDF</h3>
                            <p class="card-subtitle">Visualiza reportes S-21 y S-88 en línea</p>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-3 gap-lg mb-lg">
                                <div class="form-group">
                                    <label class="form-label">Año de Servicio</label>
                                    <input type="number" class="form-input" id="viewerYear" min="${getAnioServicio() - 2}" max="${getAnioServicio()}" value="${getAnioServicio()}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tipo de Reporte</label>
                                    <select class="form-select" id="viewerTipo">
                                        <option value="S21I" selected>S-21</option>
                                        <option value="S21T">S-21 Totales</option>
                                        <option value="S88">S-88</option>
                                    </select>
                                </div>
                                <div class="form-group" id="viewerPublicadorContainer">
                                    <label class="form-label">Publicador</label>
                                    <input class="form-input" list="viewerPublicadorList" id="viewerPublicador" placeholder="Escribe para buscar..." autocomplete="off">
                                    <datalist id="viewerPublicadorList"></datalist>
                                </div>
                                <div class="form-group" id="viewerTipoPublicadorContainer" style="display: none;">
                                    <label class="form-label">Tipo de Publicador</label>
                                    <select class="form-select" id="viewerTipoPublicador">
                                        <option value="">Cargando...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="flex gap-sm mb-lg">
                                <button class="btn btn-primary" id="viewPDFBtn">
                                    <span>👁️</span> Ver PDF
                                </button>
                                <button class="btn btn-secondary" id="downloadFromViewerBtn" style="display: none;">
                                    <span>📥</span> Descargar
                                </button>
                            </div>
                            
                            <!-- PDF Container -->
                            <div id="pdfViewerContainer" style="display: none;">
                                <div style="background: var(--bg-surface); border-radius: 8px; padding: var(--space-lg); margin-bottom: var(--space-md);">
                                    <div class="flex justify-between items-center">
                                        <button class="btn btn-sm btn-secondary" id="prevPageBtn">◀ Anterior</button>
                                        <span id="pageInfo" style="font-weight: 600;">Página 1 de 1</span>
                                        <button class="btn btn-sm btn-secondary" id="nextPageBtn">Siguiente ▶</button>
                                    </div>
                                </div>
                                <div style="background: #525659; border-radius: 8px; padding: var(--space-md); display: flex; justify-content: center; overflow: auto;">
                                    <canvas id="pdfCanvas" style="box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 100%;"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Reporte General -->
                <div id="section-general" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📊 Reporte General</h3>
                            <p class="card-subtitle">Descarga el reporte completo en Excel con datos del sistema</p>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-success" id="downloadGeneralReportBtn" style="background-color: #28a745; border-color: #28a745;">
                                <span>📑</span> Descargar Reporte Completo (.xlsx)
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Setup navigation between sections
    setupReportesNavigation();

    // Setup button handlers
    document.getElementById('viewPDFBtn').addEventListener('click', viewPDF);
    document.getElementById('prevPageBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPageBtn').addEventListener('click', () => changePage(1));
    document.getElementById('downloadFromViewerBtn').addEventListener('click', downloadCurrentPDF);
    document.getElementById('downloadGeneralReportBtn').addEventListener('click', downloadGeneralReport);

    document.getElementById('viewerTipo').addEventListener('change', () => {
        const tipo = document.getElementById('viewerTipo').value;
        if (tipo === 'S21I') {
            document.getElementById('viewerPublicadorContainer').style.display = 'block';
            document.getElementById('viewerTipoPublicadorContainer').style.display = 'none';
        } else if (tipo === 'S21T') {
            document.getElementById('viewerPublicadorContainer').style.display = 'none';
            document.getElementById('viewerTipoPublicadorContainer').style.display = 'block';
        } else {
            document.getElementById('viewerPublicadorContainer').style.display = 'none';
            document.getElementById('viewerTipoPublicadorContainer').style.display = 'none';
        }
    });
    // Load data for selects
    await loadTiposPublicador();
    await loadPublicadores();
}

// ============================================
// REPORTES SECTION NAVIGATION
// ============================================
function setupReportesNavigation() {
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

// ============================================
// LOAD DATA FOR SELECTS
// ============================================

async function loadTiposPublicador() {
    const select = document.getElementById('viewerTipoPublicador');

    try {
        const response = await fetch(`${API_BASE_URL}/publicador/tipos-publicador`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (data && data.success && data.data) {
            select.innerHTML = data.data.map(tipo => `<option value="${tipo.id}">${tipo.descripcion}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Error al cargar tipos</option>';
        }
    } catch (error) {
        console.error('Error loading tipos:', error);
        select.innerHTML = '<option value="">Error al cargar tipos</option>';
    }
}

async function loadPublicadores() {
    const datalist = document.getElementById('viewerPublicadorList');
    // Also clear input just in case
    document.getElementById('viewerPublicador').value = '';

    try {
        const data = await apiRequest('/publicador/all');

        if (data && data.success && data.data) {
            publicadoresList = data.data; // Store for later lookup
            datalist.innerHTML = data.data.map(pub => `<option value="${pub.nombre} ${pub.apellidos}">`).join('');
        } else {
            console.error('Error loading publicadores: data format incorrect');
        }
    } catch (error) {
        console.error('Error loading publicadores:', error);
    }
}

// ============================================
// PDF VIEWER FUNCTIONS
// ============================================

let currentPDF = null;
let currentPage = 1;
let currentPDFBlob = null;
let currentFileName = '';

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function viewPDF() {
    const tipo = document.getElementById('viewerTipo').value;
    const year = document.getElementById('viewerYear').value || getAnioServicio();
    const publicadorName = document.getElementById('viewerPublicador').value;

    // Find ID from name
    let publicadorId = null;
    if (publicadorName) {
        const foundPub = publicadoresList.find(p => `${p.nombre} ${p.apellidos}` === publicadorName);
        if (foundPub) {
            publicadorId = foundPub.id;
        }
    }

    const tipoPublicadorId = document.getElementById('viewerTipoPublicador').value;
    const tipoPublicadorName = document.getElementById('viewerTipoPublicador').options[document.getElementById('viewerTipoPublicador').selectedIndex]?.text || '';

    if (!year) {
        showToast('Por favor ingresa un año', 'warning');
        return;
    }
    if (tipo === 'S21I') {
        if (!publicadorId) {
            showToast('Por favor selecciona un publicador válido de la lista', 'warning');
            return;
        }
    } else if (tipo === 'S21T' && !tipoPublicadorId) {
        showToast('Por favor selecciona un tipo de publicador', 'warning');
        return;
    }
    try {
        showLoading();

        let response;
        if (tipo === 'S21I') {
            response = await fetch(`${API_BASE_URL}/fillpdf/get-s21`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    anio: parseInt(year),
                    id_publicador: parseInt(publicadorId)
                })
            });
            currentFileName = `S21_${year}_${publicadorName}.pdf`;
        } else if (tipo === 'S21T') {
            response = await fetch(`${API_BASE_URL}/fillpdf/get-s21-totales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    anio: parseInt(year),
                    id_tipo_publicador: parseInt(tipoPublicadorId)
                })
            });
            currentFileName = `S21_Totales_${year}_${tipoPublicadorName}.pdf`;
        } else if (tipo === 'S88') {
            response = await fetch(`${API_BASE_URL}/fillpdf/get-s88/${year}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
            });
            currentFileName = `S88_${year}.pdf`;
        }

        hideLoading();
        console.log(response);
        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.error || 'Error al cargar el PDF', 'error');
            return;
        }

        // Get filename
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                currentFileName = filenameMatch[1].trim().replace(/"/g, '');
            }
        }

        // Get the blob and convert to ArrayBuffer
        const blob = await response.blob();
        currentPDFBlob = blob;
        const arrayBuffer = await blob.arrayBuffer();

        // Load PDF with PDF.js
        if (typeof pdfjsLib === 'undefined') {
            showToast('PDF.js no está cargado. Por favor recarga la página.', 'error');
            return;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        currentPDF = await loadingTask.promise;
        currentPage = 1;

        // Show viewer container and download button
        document.getElementById('pdfViewerContainer').style.display = 'block';
        document.getElementById('downloadFromViewerBtn').style.display = 'inline-flex';

        // Render first page
        await renderPage(currentPage);

        showToast('PDF cargado exitosamente', 'success');

    } catch (error) {
        hideLoading();
        console.error('Error loading PDF:', error);
        showToast('Error al cargar el PDF: ' + error.message, 'error');
    }
}

async function renderPage(pageNumber) {
    if (!currentPDF) return;

    try {
        const page = await currentPDF.getPage(pageNumber);
        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');

        // Calculate scale to fit container width (max 900px)
        const maxWidth = Math.min(900, canvas.parentElement.clientWidth - 32);
        const viewport = page.getViewport({ scale: 1 });
        const scale = maxWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale: scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: scaledViewport
        };

        await page.render(renderContext).promise;

        // Update page info
        document.getElementById('pageInfo').textContent = `Página ${pageNumber} de ${currentPDF.numPages}`;
        if (currentPDF.numPages === 1) {
            document.getElementById('prevPageBtn').style.display = 'none';
            document.getElementById('nextPageBtn').style.display = 'none';
        }

        // Update button states
        document.getElementById('prevPageBtn').disabled = pageNumber === 1;
        document.getElementById('nextPageBtn').disabled = pageNumber === currentPDF.numPages;

    } catch (error) {
        console.error('Error rendering page:', error);
        showToast('Error al renderizar la página', 'error');
    }
}

function changePage(delta) {
    if (!currentPDF) return;

    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= currentPDF.numPages) {
        currentPage = newPage;
        renderPage(currentPage);
    }
}

function downloadCurrentPDF() {
    if (!currentPDFBlob) {
        showToast('No hay PDF cargado', 'warning');
        return;
    }

    // Create download link
    const url = window.URL.createObjectURL(currentPDFBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showToast('PDF descargado', 'success');
}

async function downloadGeneralReport() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/secretario/export/template`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al descargar el reporte');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Get filename from header if possible
        let filename = `Reporte_General_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) filename = match[1].replace(/"/g, '');
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Reporte descargado exitosamente', 'success');
    } catch (error) {
        console.error('Error downloading report:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}
