import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const useUser = () => {
    return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const storedProfile = await AsyncStorage.getItem('@user_profile');
            const storedToken = await AsyncStorage.getItem('@auth_token');
            if (storedProfile && storedToken) {
                setUserProfile(JSON.parse(storedProfile));
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Error loading user profile', error);
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async (profileData) => {
        try {
            await AsyncStorage.setItem('@user_profile', JSON.stringify(profileData));
            setUserProfile(profileData);
        } catch (error) {
            console.error('Error saving user profile', error);
            throw error; // Rethrow to handle in the UI
        }
    };

    const login = async (username, password) => {
        try {
            // Note: Update to use api.js when we refactor it
            const response = await fetch('http://localhost:3000/api/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();

            if (data.success) {
                await AsyncStorage.setItem('@auth_token', data.token);
                await AsyncStorage.setItem('@user_profile', JSON.stringify(data.user));
                setToken(data.token);
                setUserProfile(data.user);
                return { success: true };
            }
            return { success: false, error: data.error || 'Credenciales inválidas' };
        } catch (error) {
            console.error('Error in login:', error);
            return { success: false, error: 'Ocurrió un error. Verifica tu conexión.' };
        }
    };

    const clearProfile = async () => {
        try {
            await AsyncStorage.removeItem('@user_profile');
            await AsyncStorage.removeItem('@auth_token');
            setUserProfile(null);
            setToken(null);
        } catch (error) {
            console.error('Error clearing profile', error);
        }
    }

    const value = {
        userProfile,
        token,
        loading,
        login,
        saveProfile,
        clearProfile
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
