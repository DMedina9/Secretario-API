import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';

// For Expo Go on Android, you often need to use your machine's local IP address
// rather than localhost because localhost points to the Android emulator itself.
// Replace with your actual local IP network address, e.g., 'http://192.168.1.100:5000/api'
const API_URL = __DEV__ ? 'http://192.168.1.72:3000/api' : 'https://secretario-api.onrender.com/api'; // I'll use a placeholder for now, user may need to adjust

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-mobile-app': 'true'
    },
});

// Request interceptor to add the auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            console.log('Sesión expirada o no autorizada');
            // We can emit an event here or depend on APIs failing to kick user out
            // For now, removing the token will let the next app startup log them out,
            // or we could use an event emitter. Let's just remove it.
            await AsyncStorage.removeItem('@auth_token');
            // Optional: emit an event for the UI to log out immediately 
        }
        return Promise.reject(error);
    }
);

export default api;
