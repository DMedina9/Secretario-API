import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import Loading from '../Common/Loading';

const DatosBasicos = () => {
    const { mesInforme } = useAnioServicio();
    const [privilegios, setPrivilegios] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [privRes, tiposRes] = await Promise.all([
                    apiRequest('/publicador/privilegios'),
                    apiRequest('/publicador/tipos-publicador')
                ]);

                if (privRes?.data) setPrivilegios(privRes.data);
                if (tiposRes?.data) setTipos(tiposRes.data);
            } catch (error) {
                console.error("Error loading basic data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg fade-in">
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Datos Básicos</h3>
                </div>
                <div className="card-body">
                    <div className="mb-lg">
                        <h5 className="font-bold mb-sm border-b border-light pb-xs">Privilegios Disponibles</h5>
                        <ul className="list-disc pl-md text-secondary">
                            {privilegios.length > 0 ? (
                                privilegios.map(p => <li key={p.id}>{p.descripcion}</li>)
                            ) : (
                                <li className="text-muted">No hay datos</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-bold mb-sm border-b border-light pb-xs">Tipos de Publicador</h5>
                        <ul className="list-disc pl-md text-secondary">
                            {tipos.length > 0 ? (
                                tipos.map(t => <li key={t.id}>{t.descripcion}</li>)
                            ) : (
                                <li className="text-muted">No hay datos</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Mes de Informe Actual</h3>
                    <p className="card-subtitle">Referencia global para informes</p>
                </div>
                <div className="card-body flex justify-center items-center py-xl">
                    <div className="stat-value text-4xl">
                        {mesInforme ? mesInforme.format('MMMM YYYY') : 'Cargando...'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatosBasicos;
