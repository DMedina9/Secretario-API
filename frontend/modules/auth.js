// ============================================
// AUTH MODULE
// ============================================

import { apiRequest, showToast, closeAuthModal } from '../app.js';

let currentUser = null;
let authToken = null;

// ============================================
// AUTHENTICATION STATE
// ============================================
export function isAuthenticated() {
    return authToken !== null;
}

export function getToken() {
    return authToken;
}

export function getCurrentUser() {
    return currentUser;
}

export function hasPermission(permission) {
    return currentUser && currentUser.role === permission;
}

// ============================================
// LOGIN
// ============================================
export async function login(username, password) {
    try {
        const data = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data && data.token) {
            authToken = data.token;
            currentUser = data.user || { username, role: data.role || 'user' };

            // Save to localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            updateUIForAuth();
            showToast('¡Inicio de sesión exitoso!', 'success');
            closeAuthModal();

            return true;
        }

        return false;
    } catch (error) {
        showToast('Error al iniciar sesión', 'error');
        return false;
    }
}

// ============================================
// SIGNUP
// ============================================
export async function signup(name, username, email, password, role = 'user') {
    try {
        const data = await apiRequest('/signup', {
            method: 'POST',
            body: JSON.stringify({ name, username, email, password, role })
        });

        if (data && data.success) {
            showToast('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');

            // Switch to login form
            document.getElementById('signupForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('authModalTitle').textContent = 'Iniciar Sesión';

            return true;
        }

        return false;
    } catch (error) {
        showToast('Error al registrarse', 'error');
        return false;
    }
}

// ============================================
// LOGOUT
// ============================================
export function logout() {
    authToken = null;
    currentUser = null;

    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    updateUIForAuth();
    showToast('Sesión cerrada', 'info');
}

// ============================================
// UPDATE UI BASED ON AUTH STATE
// ============================================
function updateUIForAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');

    if (isAuthenticated()) {
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        userInfo.classList.remove('hidden');

        if (currentUser) {
            const name = currentUser.name || currentUser.username;
            userName.textContent = name;
            userAvatar.textContent = name.charAt(0).toUpperCase();
        }
    } else {
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        userInfo.classList.add('hidden');
    }
}

// ============================================
// INITIALIZATION
// ============================================
export function initAuth() {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateUIForAuth();
    }

    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        await login(username, password);
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const role = document.getElementById('signupRole').value;

        await signup(name, username, email, password, role);
    });
}
