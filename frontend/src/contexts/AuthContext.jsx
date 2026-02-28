import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getToken, getUser, setToken, setUser, removeToken, removeUser } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(getUser());
    const [token, setTokenState] = useState(getToken());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Here we could validate the token with the backend if needed
        // For now, we trust the local storage until a 401 happens
        setLoading(false);

        const handleUnauthorized = () => {
            logout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    const login = async (username, password) => {
        try {
            const data = await apiRequest('/account/login', {
                method: 'POST',
                body: { username, password }
            });

            if (data.success) {
                const { token, user } = data;
                setToken(token);
                setUser(user);
                setTokenState(token);
                setUserState(user);
                return { success: true };
            }
            return { success: false, error: 'Credenciales inválidas' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        removeToken();
        removeUser();
        setTokenState(null);
        setUserState(null);
    };

    const isAuthenticated = () => !!token;

    const getAuthHeaders = () => {
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading, getAuthHeaders }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
