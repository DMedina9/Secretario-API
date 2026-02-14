import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme || 'light'; // Default to light
    });

    useEffect(() => {
        const root = document.documentElement;
        // Remove previous theme class/attribute if you were using classes
        // root.classList.remove('light', 'dark'); 
        // root.classList.add(theme);
        
        // Using data-attribute is often cleaner for CSS variables
        root.setAttribute('data-theme', theme);
        
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
