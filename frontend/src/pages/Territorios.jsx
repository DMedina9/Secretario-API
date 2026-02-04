import React, { useState } from 'react';
import MapComponent from '../components/Territorios/MapComponent';
import TerritoriosConfig from '../components/Territorios/TerritoriosConfig';

const Territorios = () => {
    const [refreshMap, setRefreshMap] = useState(0);

    const triggerMapRefresh = () => {
        setRefreshMap(prev => prev + 1);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Territorios</h1>
                <p className="page-description">Gestión de territorios de la congregación</p>
            </div>

            <div className="grid grid-cols-1 gap-lg pb-xl">
                <MapComponent refreshTrigger={refreshMap} />
                <TerritoriosConfig onKmlUploaded={triggerMapRefresh} />
            </div>
        </div>
    );
};

export default Territorios;
