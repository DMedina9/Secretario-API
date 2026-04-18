import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';

const AnioServicioContext = createContext(null);

export const AnioServicioProvider = ({ children }) => {
    const [mesInforme, setMesInforme] = useState(dayjs());
    const [anioServicio, setAnioServicio] = useState(dayjs().year() + (dayjs().month() >= 8 ? 1 : 0));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // In offline mode, we default to the current month and correct service year
        const now = dayjs();
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
