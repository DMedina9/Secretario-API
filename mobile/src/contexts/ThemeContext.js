import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('@dark_mode');
                if (savedTheme !== null) {
                    setIsDarkMode(JSON.parse(savedTheme));
                }
            } catch (error) {
                console.error('Error loading theme:', error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const newMode = !isDarkMode;
            setIsDarkMode(newMode);
            await AsyncStorage.setItem('@dark_mode', JSON.stringify(newMode));
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = {
        background: isDarkMode ? '#121212' : '#f3f4f6',
        card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        header: isDarkMode ? '#000000' : '#1E1E1E',
        text: isDarkMode ? '#FFFFFF' : '#000000',
        textSecondary: isDarkMode ? '#A0A0A0' : '#4B5563',
        primary: '#3b82f6',
        warning: '#f59e0b',
        success: '#22c55e',
        border: isDarkMode ? '#333333' : '#e5e7eb',
        notification: '#ef4444',
        danger: '#ef4444',
        modalOverlay: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
        inputBackground: isDarkMode ? '#2D2D2D' : '#F3F4F6',
        inputText: isDarkMode ? '#FFFFFF' : '#000000',
    };

    const navigationTheme = {
        dark: isDarkMode,
        colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.text,
            border: colors.border,
            notification: colors.notification,
        },
        fonts: {
            regular: { fontFamily: 'sans-serif', fontWeight: 'normal' },
            medium: { fontFamily: 'sans-serif', fontWeight: '500' },
            bold: { fontFamily: 'sans-serif', fontWeight: 'bold' },
            heavy: { fontFamily: 'sans-serif', fontWeight: '900' },
        },
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors, navigationTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
