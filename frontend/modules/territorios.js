// ============================================
// TERRITORIOS MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading } from '../app.js';

let map;
let kmlLayer;

export async function renderTerritorios(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Territorios</h1>
            <p class="page-description">Gestión de territorios de la congregación</p>
        </div>
        
        <div class="grid grid-cols-1 gap-lg mb-xl">
            <!-- Map Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Mapa de Territorios</h3>
                </div>
                <div class="card-body">
                    <div id="map" style="height: 500px; width: 100%; border-radius: 8px;"></div>
                </div>
            </div>
            
            <!-- Configuration Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Configuración de Territorios</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 gap-md mb-md">
                        <div class="form-group">
                            <label class="form-label">Número total de territorios</label>
                            <input type="number" class="form-input" id="totalTerritorios" min="0" placeholder="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Territorios no predicados</label>
                            <input type="number" class="form-input" id="territoriosNoPredicados" min="0" placeholder="0">
                        </div>
                    </div>
                    <button class="btn btn-primary" id="saveConfigBtn">Guardar Configuración</button>
                </div>
            </div>

            <!-- KML Upload Card -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Subir archivo KML</h3>
                    <p class="card-subtitle">Sube el archivo KML con los límites de los territorios</p>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">Seleccionar archivo .kml</label>
                        <button class="btn btn-primary" id="uploadKmlBtn">Subir KML</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize map
    initMap();

    // Setup event listeners
    document.getElementById('uploadKmlBtn').addEventListener('click', uploadKML);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfiguration);

    // Load existing data
    await loadConfiguration();
    await checkAndLoadKML();
}

function initMap() {
    // Initialize Leaflet map
    map = L.map('map').setView([19.4326, -99.1332], 11); // Default to Mexico City

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

async function uploadKML() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.kml';
    fileInput.click();
    fileInput.addEventListener('change', async () => {
        if (!fileInput.files.length) {
            showToast('Por favor, selecciona un archivo .kml', 'warning');
            return;
        }
        const file = fileInput.files[0];

        try {
            showLoading();

            const formData = new FormData();
            formData.append('kml', file);

            const result = await apiRequest('/territorios/upload', {
                method: 'POST',
                body: formData
            });

            hideLoading();

            if (result && result.success) {
                showToast('Archivo KML subido exitosamente', 'success');
                fileInput.value = ''; // Clear file input

                // Load the KML onto the map
                await loadKMLOnMap();
            } else {
                showToast(result.error || 'Error al subir el archivo', 'error');
            }
        } catch (error) {
            hideLoading();
            showToast('Error al subir el archivo', 'error');
        }
    });
}

async function checkAndLoadKML() {
    try {
        const result = await apiRequest('/territorios/kml/exists');

        if (result && result.success && result.exists) {
            await loadKMLOnMap();
        }
    } catch (error) {
        console.error('Error checking KML existence:', error);
    }
}

async function loadKMLOnMap() {
    try {
        showLoading();

        // Fetch KML content
        const response = await apiRequest('/territorios/kml');

        if (!response.success) {
            throw new Error(response.error || 'Error al cargar el archivo KML');
        }

        const kmlText = response.data;

        // Remove existing KML layer if any
        if (kmlLayer) {
            map.removeLayer(kmlLayer);
        }

        // Parse KML to GeoJSON
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
        const geojson = toGeoJSON.kml(kmlDoc);

        // Add GeoJSON layer to map
        kmlLayer = L.geoJSON(geojson, {
            style: {
                color: '#3388ff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
                }
            }
        }).addTo(map);

        // Fit map to KML bounds
        map.fitBounds(kmlLayer.getBounds());

        hideLoading();
        showToast('KML cargado en el mapa', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error loading KML:', error);
        showToast('Error al cargar el KML en el mapa', 'error');
    }
}

async function loadConfiguration() {
    try {
        // Load total territorios
        const totalResult = await apiRequest('/configuraciones/total_territorios');
        if (totalResult && totalResult.success && totalResult.data) {
            document.getElementById('totalTerritorios').value = totalResult.data.valor || '';
        }

        // Load territorios no predicados
        const noPredicadosResult = await apiRequest('/configuraciones/territorios_no_predicados');
        if (noPredicadosResult && noPredicadosResult.success && noPredicadosResult.data) {
            document.getElementById('territoriosNoPredicados').value = noPredicadosResult.data.valor || '';
        }
    } catch (error) {
        console.error('Error loading configuration:', error);
    }
}

async function saveConfiguration() {
    const totalTerritorios = document.getElementById('totalTerritorios').value;
    const territoriosNoPredicados = document.getElementById('territoriosNoPredicados').value;

    if (!totalTerritorios || !territoriosNoPredicados) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        showLoading();

        // Update total territorios
        const totalResult = await apiRequest('/configuraciones/total_territorios', {
            method: 'PUT',
            body: { valor: totalTerritorios }
        });

        // Update territorios no predicados
        const noPredicadosResult = await apiRequest('/configuraciones/territorios_no_predicados', {
            method: 'PUT',
            body: { valor: territoriosNoPredicados }
        });

        hideLoading();

        if (totalResult && totalResult.success && noPredicadosResult && noPredicadosResult.success) {
            showToast('Configuración guardada exitosamente', 'success');
        } else {
            showToast('Error al guardar la configuración', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error al guardar la configuración', 'error');
    }
}
