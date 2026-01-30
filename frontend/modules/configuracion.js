// ============================================
// CONFIGURACIÓN MODULE
// ============================================
import { getToken } from './auth.js';
import { API_BASE_URL, apiRequest, showToast, showLoading, hideLoading, showConfirm, getAnioServicio } from '../app.js';

let configuraciones = [];
let users = [];
let isCreatingUser = false;

export async function renderConfiguracion(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Configuración</h1>
            <p class="page-description">Gestión de configuraciones del sistema</p>
        </div>
        
        <div class="config-layout">
            <!-- Sidebar Navigation -->
            <aside class="config-sidebar">
                <nav class="config-nav">
                    <a href="#" data-section="configuraciones" class="config-nav-item active">
                        <span class="config-nav-icon">⚙️</span>
                        <span class="config-nav-text">Configuraciones</span>
                    </a>
                    <a href="#" data-section="gestion" class="config-nav-item">
                        <span class="config-nav-icon">📊</span>
                        <span class="config-nav-text">Gestión de Datos</span>
                    </a>
                    <a href="#" data-section="s21" class="config-nav-item">
                        <span class="config-nav-icon">📄</span>
                        <span class="config-nav-text">Reportes S-21</span>
                    </a>
                    <a href="#" data-section="mantenimiento" class="config-nav-item">
                        <span class="config-nav-icon">🗑️</span>
                        <span class="config-nav-text">Mantenimiento</span>
                    </a>
                    <a href="#" data-section="usuarios" class="config-nav-item">
                        <span class="config-nav-icon">👥</span>
                        <span class="config-nav-text">Usuarios</span>
                    </a>
                </nav>
            </aside>
            
            <!-- Content Area -->
            <main class="config-content">
                <!-- Section: Configuraciones del Sistema -->
                <div id="section-configuraciones" class="config-section active">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Configuraciones del Sistema</h3>
                            <p class="card-subtitle">Edita los valores de configuración</p>
                        </div>
                        <div class="card-body">
                            <div class="table-container">
                                <table class="table" id="configTable">
                                    <thead>
                                        <tr>
                                            <th>Clave</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody id="configTableBody">
                                        <tr><td colspan="2" class="text-center text-muted">Cargando...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <button class="btn btn-primary mt-md" id="saveConfigBtn">Guardar Configuraciones</button>
                        </div>
                    </div>
                </div>

                <!-- Section: Gestión de Datos -->
                <div id="section-gestion" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Gestión de Datos</h3>
                            <p class="card-subtitle">Importar y Exportar información del sistema</p>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-3 gap-lg mt-md">
                                <div>
                                    <h4>Tablas</h4>
                                    <div class="flex gap-sm items-center">
                                        <div class="radio-group">
                                            <label for="publicadores" class="radio-input">
                                                <input id="publicadores" type="radio" name="dataTable" value="publicador" checked>
                                                Publicadores
                                            </label>
                                            <label for="informes" class="radio-input">
                                                <input id="informes" type="radio" name="dataTable" value="informe">
                                                Informes
                                            </label>
                                            <label for="asistencias" class="radio-input">
                                                <input id="asistencias" type="radio" name="dataTable" value="asistencias">
                                                Asistencias
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4>Importar</h4>
                                    <p class="text-muted text-sm">Carga masiva desde Excel (.xlsx)</p>
                                    <div class="flex gap-sm">
                                        <button class="btn btn-secondary" onclick="window.importData()">Importar</button>
                                    </div>
                                </div>
                                <div>
                                    <h4>Exportar</h4>
                                    <p class="text-muted text-sm">Descargar datos actuales</p>
                                    <div class="flex gap-sm">
                                        <button class="btn btn-secondary" onclick="window.exportData('xlsx')">Excel</button>
                                        <button class="btn btn-secondary" onclick="window.exportData('json')">JSON</button>
                                        <button class="btn btn-secondary" onclick="window.exportData('xml')">XML</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Reportes S-21 -->
                <div id="section-s21" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Descargar S-21</h3>
                            <p class="card-subtitle">Descargar todos los informes S-21</p>
                        </div>
                        <div class="card-body">
                            <div class="flex gap-sm">
                                <button class="btn btn-secondary" id="downloadAllS21Btn">Descargar todos los S-21</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Mantenimiento -->
                <div id="section-mantenimiento" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Mantenimiento de la Base de Datos</h3>
                            <p class="card-subtitle">Eliminar registros antiguos para optimizar el sistema</p>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-cols-2 gap-md">
                                <div>
                                    <h4>Limpiar Asistencias</h4>
                                    <p class="text-muted text-sm">Eliminar registros de asistencias de hace 2 años o más desde la fecha actual</p>
                                    <button class="btn btn-warning mt-sm" id="cleanupAsistenciasBtn">
                                        🗑️ Limpiar Asistencias Antiguas
                                    </button>
                                </div>
                                <div>
                                    <h4>Limpiar Informes</h4>
                                    <p class="text-muted text-sm">Eliminar informes de hace 2 años o más desde el último informe de cada publicador</p>
                                    <button class="btn btn-warning mt-sm" id="cleanupInformesBtn">
                                        🗑️ Limpiar Informes Antiguos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section: Usuarios -->
                <div id="section-usuarios" class="config-section">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Administración de Usuarios</h3>
                            <p class="card-subtitle">Gestiona los usuarios del sistema</p>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-primary mb-md" id="createUserBtn">Crear Usuario</button>
                            
                            <!-- Create/Edit User Form (hidden by default) -->
                            <div id="userFormContainer" style="display: none;" class="mb-md">
                                <div class="card">
                                    <div class="card-body">
                                        <h4 id="userFormTitle">Crear Usuario</h4>
                                        <div class="grid grid-cols-2 gap-md mb-md">
                                            <div class="form-group">
                                                <label class="form-label">Nombre de usuario</label>
                                                <input type="text" class="form-input" id="userUsername" required>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Email</label>
                                                <input type="email" class="form-input" id="userEmail" required>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Nombre</label>
                                                <input type="text" class="form-input" id="userFirstName" required>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Apellido</label>
                                                <input type="text" class="form-input" id="userLastName" required>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Contraseña</label>
                                                <input type="password" class="form-input" id="userPassword">
                                                <small class="text-muted" id="passwordHint">Dejar vacío para mantener la contraseña actual</small>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Rol</label>
                                                <select class="form-select" id="userRole">
                                                    <option value="USER">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <button class="btn btn-secondary" id="cancelUserBtn">Cancelar</button>
                                            <button class="btn btn-primary" id="saveUserBtn">Guardar</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="table-container">
                                <table class="table" id="usersTable">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Nombre</th>
                                            <th>Apellido</th>
                                            <th>Rol</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="usersTableBody">
                                        <tr><td colspan="7" class="text-center text-muted">Cargando...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Setup navigation between sections
    setupConfigNavigation();

    // Setup event listeners
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfigurations);
    document.getElementById('createUserBtn').addEventListener('click', showCreateUserForm);
    document.getElementById('cancelUserBtn').addEventListener('click', hideUserForm);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    document.getElementById('downloadAllS21Btn').addEventListener('click', downloadAllS21);
    document.getElementById('cleanupAsistenciasBtn').addEventListener('click', cleanupOldAsistencias);
    document.getElementById('cleanupInformesBtn').addEventListener('click', cleanupOldInformes);

    // Load data
    await loadConfigurations();
    await loadUsers();
}

// ============================================
// CONFIG SECTION NAVIGATION
// ============================================
function setupConfigNavigation() {
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

async function loadConfigurations() {
    try {
        const result = await apiRequest('/configuraciones/');
        if (result && result.success && result.data) {
            configuraciones = result.data;
            renderConfigTable();
        }
    } catch (error) {
        console.error('Error loading configurations:', error);
        showToast('Error al cargar configuraciones', 'error');
    }
}

function renderConfigTable() {
    const tbody = document.getElementById('configTableBody');

    if (configuraciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No hay configuraciones</td></tr>';
        return;
    }

    tbody.innerHTML = configuraciones.map(config => `
        <tr>
            <td data-label="Clave"><strong>${config.clave.replace(/_/g, ' ')}</strong></td>
            <td data-label="Valor">
                <input id="${config.clave}" type="${config.tipo || 'text'}"
                       class="form-input" 
                       data-key="${config.clave}" 
                       value="${config.valor || ''}"
                       style="max-width: 400px;">
            </td>
        </tr>
    `).join('');
}

async function saveConfigurations() {
    try {
        showLoading();

        // Collect all values from inputs
        const inputs = document.querySelectorAll('#configTableBody input[data-key]');
        const updatedConfigs = Array.from(inputs).map(input => ({
            clave: input.dataset.key,
            valor: input.value
        }));

        const result = await apiRequest('/configuraciones/bulk', {
            method: 'PUT',
            body: { configuraciones: updatedConfigs }
        });

        hideLoading();

        if (result && result.success) {
            showToast('Configuraciones guardadas exitosamente', 'success');
            await loadConfigurations();
        } else {
            showToast(result.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error al guardar configuraciones', 'error');
    }
}

// ============================================
// GENERATE FUNCTIONS
// ============================================

async function downloadAllS21() {
    await downloadFile('/fillpdf/get-s21', {
        anio: null
    }, `S21_Por_Publicador.zip`);
}

async function loadUsers() {
    try {
        const result = await apiRequest('/user/all');

        if (result && result.success && result.data) {
            users = result.data;
            renderUsersTable();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error al cargar usuarios', 'error');
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay usuarios</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td data-label="ID">${user.id}</td>
            <td data-label="Usuario">${user.username}</td>
            <td data-label="Email">${user.email}</td>
            <td data-label="Nombre">${user.firstName}</td>
            <td data-label="Apellido">${user.lastName}</td>
            <td data-label="Rol"><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${user.role}</span></td>
            <td data-label="Acciones">
                <button class="btn btn-sm btn-secondary" onclick="window.editUser(${user.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="window.deleteUser(${user.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function showCreateUserForm() {
    isCreatingUser = true;
    document.getElementById('userFormTitle').textContent = 'Crear Usuario';
    document.getElementById('passwordHint').style.display = 'none';
    document.getElementById('userFormContainer').style.display = 'block';

    // Clear form
    document.getElementById('userUsername').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userFirstName').value = '';
    document.getElementById('userLastName').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = 'USER';
    document.getElementById('userPassword').required = true;
}

function hideUserForm() {
    document.getElementById('userFormContainer').style.display = 'none';
    isCreatingUser = false;
}

window.editUser = function (userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    isCreatingUser = false;
    document.getElementById('userFormTitle').textContent = 'Editar Usuario';
    document.getElementById('passwordHint').style.display = 'block';
    document.getElementById('userFormContainer').style.display = 'block';
    document.getElementById('userPassword').required = false;

    // Fill form
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userFirstName').value = user.firstName;
    document.getElementById('userLastName').value = user.lastName;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role;

    // Store ID for update
    document.getElementById('saveUserBtn').dataset.userId = userId;
};

async function saveUser() {
    const username = document.getElementById('userUsername').value;
    const email = document.getElementById('userEmail').value;
    const firstName = document.getElementById('userFirstName').value;
    const lastName = document.getElementById('userLastName').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;

    if (!username || !email || !firstName || !lastName) {
        showToast('Por favor completa todos los campos requeridos', 'warning');
        return;
    }

    if (isCreatingUser && !password) {
        showToast('La contraseña es requerida para nuevos usuarios', 'warning');
        return;
    }

    try {
        showLoading();

        const body = { username, email, firstName, lastName, role };
        if (password) body.password = password;

        let result;
        if (isCreatingUser) {
            result = await apiRequest('/user', {
                method: 'POST',
                body
            });
        } else {
            const userId = document.getElementById('saveUserBtn').dataset.userId;
            result = await apiRequest(`/user/${userId}`, {
                method: 'PUT',
                body
            });
        }

        hideLoading();

        if (result && result.success) {
            showToast(result.message || 'Usuario guardado exitosamente', 'success');
            hideUserForm();
            await loadUsers();
        } else {
            showToast(result.error || 'Error al guardar', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Error al guardar usuario', 'error');
    }
}

window.deleteUser = function (userId) {
    showConfirm('¿Estás seguro de que deseas eliminar este usuario?', async () => {
        try {
            showLoading();

            const result = await apiRequest(`/user/${userId}`, {
                method: 'DELETE'
            });

            hideLoading();

            if (result && result.success) {
                showToast('Usuario eliminado exitosamente', 'success');
                await loadUsers();
            } else {
                showToast(result.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            hideLoading();
            showToast('Error al eliminar usuario', 'error');
        }
    });
};

// ==========================================
// DATA MANAGEMENT FUNCTIONS
// ==========================================

window.importData = async function () {
    const section = document.querySelector('input[name="dataTable"]:checked').value;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';
    fileInput.click();
    fileInput.addEventListener('change', async () => {
        if (!fileInput.files.length) {
            showToast('Por favor, selecciona un archivo', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            showLoading();
            // Adjust endpoint based on section
            const endpoint = `/${section}/import`;

            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: formData
            });

            hideLoading();

            if (data && (data.success || data.message)) { // Some endpoints return message directly or in success
                showToast('Importación completada con éxito', 'success');
                fileInput.value = ''; // Clear input
            } else {
                showToast('Error en la importación', 'error');
            }
        } catch (error) {
            hideLoading();
            showToast('Error al importar: ' + error.message, 'error');
        }
    });
};

async function downloadFile(endpoint, params, filename = 'reporte.pdf') {
    try {
        showLoading();

        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        };
        if (params) {
            options.method = 'POST';
            options.body = JSON.stringify(params);
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        hideLoading();

        if (!response.ok) {
            const errorData = await response.json();
            showToast(errorData.error || 'Error al descargar el archivo', 'error');
            return;
        }
        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1].trim().replace(/"/g, '');
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
        console.error('Error downloading file:', error);
        showToast('Error al descargar el archivo: ' + error.message, 'error');
    }
}

// ============================================
// EXPORT DATA
// ============================================
window.exportData = async function (format) {
    try {
        const section = document.querySelector('input[name="dataTable"]:checked').value;
        let filename = `${section}_export.${format === 'excel' ? 'xlsx' : format}`;
        await downloadFile(`/${section}/export?format=${format}`, null, filename);
        return;
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Error al exportar datos: ' + error.message, 'error');
    }
};

// ==========================================
// DATABASE MAINTENANCE FUNCTIONS
// ==========================================

async function cleanupOldAsistencias() {
    showConfirm(
        '⚠️ ¿Estás seguro de que deseas eliminar todas las asistencias de hace 2 años o más?\n\nEsta acción NO se puede deshacer.',
        async () => {
            // Segunda confirmación
            showConfirm(
                '⚠️ CONFIRMACIÓN FINAL: Se eliminarán PERMANENTEMENTE todos los registros de asistencias anteriores a 2 años desde hoy.\n\n¿Continuar?',
                async () => {
                    try {
                        showLoading();

                        const result = await apiRequest('/asistencias/maintenance/old', {
                            method: 'DELETE'
                        });

                        hideLoading();

                        if (result && result.success) {
                            showToast(
                                `✅ ${result.message}\nRegistros eliminados: ${result.deleted}`,
                                'success'
                            );
                        } else {
                            showToast(result.error || 'Error al eliminar asistencias', 'error');
                        }
                    } catch (error) {
                        hideLoading();
                        showToast('Error al eliminar asistencias antiguas: ' + error.message, 'error');
                    }
                }
            );
        }
    );
}

async function cleanupOldInformes() {
    showConfirm(
        '⚠️ ¿Estás seguro de que deseas eliminar los informes antiguos?\n\nSe eliminarán informes de hace 2 años o más desde el último informe de cada publicador.\n\nEsta acción NO se puede deshacer.',
        async () => {
            // Segunda confirmación
            showConfirm(
                '⚠️ CONFIRMACIÓN FINAL: Se eliminarán PERMANENTEMENTE todos los informes antiguos (2+ años desde el último informe de cada publicador).\n\n¿Continuar?',
                async () => {
                    try {
                        showLoading();

                        const result = await apiRequest('/informe/maintenance/old', {
                            method: 'DELETE'
                        });

                        hideLoading();

                        if (result && result.success) {
                            showToast(
                                `✅ ${result.message}\nRegistros eliminados: ${result.deleted}`,
                                'success'
                            );
                        } else {
                            showToast(result.error || 'Error al eliminar informes', 'error');
                        }
                    } catch (error) {
                        hideLoading();
                        showToast('Error al eliminar informes antiguos: ' + error.message, 'error');
                    }
                }
            );
        }
    );
}

