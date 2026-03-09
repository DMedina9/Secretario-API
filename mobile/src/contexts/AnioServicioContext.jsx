import React, { createContext, useContext, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import api from '../services/api';

const AnioServicioContext = createContext(null);

export const AnioServicioProvider = ({ children }) => {
    const [mesInforme, setMesInforme] = useState(dayjs());
    const [anioServicio, setAnioServicio] = useState(dayjs().year());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                let mesData = await api.get('/secretario/mes-informe');
                const fecha = (mesData.data && mesData.data.data) ? dayjs(mesData.data.data) : dayjs();

                setMesInforme(fecha);

                let anio = fecha.year();
                if (fecha.month() >= 8) { // Septiembre (index 8) onwards starts next service year
                    anio++;
                }
                setAnioServicio(anio);
            } catch (error) {
                console.error('Error fetching service year:', error);
                // Fallback using current date
                const now = dayjs();
                setMesInforme(now);
                setAnioServicio(now.year() + (now.month() >= 8 ? 1 : 0));
            } finally {
                setLoading(false);
            }
        };

        // Only run if we have a token? Or is this public?
        // It seems public or at least safe to try.
        init();
    }, []);

    return (
        <AnioServicioContext.Provider value={{ mesInforme, anioServicio, loading }}>
            {children}
        </AnioServicioContext.Provider>
    );
};

export const useAnioServicio = () => useContext(AnioServicioContext);
