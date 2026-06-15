import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';

const AnioServicioContext = createContext(null);

export const AnioServicioProvider = ({ children }) => {
    const [mesInforme, setMesInforme] = useState(dayjs().subtract(1, 'month'));
    const [anioServicio, setAnioServicio] = useState(mesInforme.year() + (mesInforme.month() >= 8 ? 1 : 0));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const now = dayjs().subtract(1, 'month');
        setMesInforme(now);
        setAnioServicio(now.year() + (now.month() >= 8 ? 1 : 0));
        setLoading(false);
    }, []);

    return (
        <AnioServicioContext.Provider value={{ mesInforme, anioServicio, loading }}>
            {children}
        </AnioServicioContext.Provider>
    );
};

export const useAnioServicio = () => useContext(AnioServicioContext);
