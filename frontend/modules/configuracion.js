// ============================================
// CONFIGURACIÓN MODULE
// ============================================

import { apiRequest, showToast, showLoading, hideLoading, showConfirm } from '../app.js';

let configuraciones = [];
let users = [];
let isCreatingUser = false;

export async function renderConfiguracion(container) {
    container.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Configuración</h1>
            <p class="page-description">Gestión de configuraciones del sistema y usuarios</p>
        </div>
        
        <div class="grid grid-cols-1 gap-lg mb-xl">
            <!-- Configuration Card -->
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
            
            <!-- Users Card -->
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
    `;

    // Setup event listeners
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfigurations);
    document.getElementById('createUserBtn').addEventListener('click', showCreateUserForm);
    document.getElementById('cancelUserBtn').addEventListener('click', hideUserForm);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    // Load data
    await loadConfigurations();
    await loadUsers();
}

async function loadConfigurations() {
    try {
        const result = await apiRequest('/configuraciones/');
        console.log(result);
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
            <td><strong>${config.clave}</strong></td>
            <td>
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
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${user.role}</span></td>
            <td>
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
