export const API_BASE_URL = ''; // Using proxy defined in vite.config.js

export const getToken = () => localStorage.getItem('auth_token');
export const setToken = (token) => localStorage.setItem('auth_token', token);
export const removeToken = () => localStorage.removeItem('auth_token');
export const getUser = () => {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        return null;
    }
};
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        ...options.headers
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        typeof options.body !== 'string'
    ) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized is handled better in the context or where this is called
        // but we can throw a specific error
        if (response.status === 401) {
            removeToken();
            removeUser();
            throw new Error('Unauthorized'); // Let the caller or global handler deal with redirect
        }

        const data = await response.json();

        if (!response.ok && !data.success) {
            throw new Error(data.error || 'Error en la solicitud');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
