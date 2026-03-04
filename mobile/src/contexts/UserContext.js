import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const useUser = () => {
    return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const storedProfile = await AsyncStorage.getItem('@user_profile');
            if (storedProfile) {
                setUserProfile(JSON.parse(storedProfile));
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

    const clearProfile = async () => {
        try {
            await AsyncStorage.removeItem('@user_profile');
            setUserProfile(null);
        } catch (error) {
            console.error('Error clearing profile', error);
        }
    }

    const value = {
        userProfile,
        loading,
        saveProfile,
        clearProfile
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
