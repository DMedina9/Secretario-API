import axios from 'axios';

// For Expo Go on Android, you often need to use your machine's local IP address
// rather than localhost because localhost points to the Android emulator itself.
// Replace with your actual local IP network address, e.g., 'http://192.168.1.100:5000/api'
const API_URL = 'http://localhost:3000/api'; // I'll use a placeholder for now, user may need to adjust

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'x-mobile-app': 'true'
    },
});

export default api;
