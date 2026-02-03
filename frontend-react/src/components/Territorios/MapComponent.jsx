import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { kml } from '@tmcw/togeojson';
import { apiRequest } from '../../utils/api';
import Loading from '../Common/Loading';
import { useToast } from '../../contexts/ToastContext';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const FitBounds = ({ geoData }) => {
    const map = useMap();
    useEffect(() => {
        if (geoData) {
            const layer = L.geoJSON(geoData);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            }
        }
    }, [geoData, map]);
    return null;
};

const MapComponent = ({ refreshTrigger }) => { // refreshTrigger to reload KML
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadKML();
    }, [refreshTrigger]);

    const loadKML = async () => {
        try {
            const existsRes = await apiRequest('/territorios/kml/exists');
            if (existsRes?.exists) {
                setLoading(true);
                const kmlRes = await apiRequest('/territorios/kml');
                if (kmlRes?.success) {
                    const parser = new DOMParser();
                    const kmlDoc = parser.parseFromString(kmlRes.data, 'text/xml');
                    const geoData = kml(kmlDoc);
                    setGeoJsonData(geoData);
                }
            } else {
                setGeoJsonData(null);
            }
        } catch (error) {
            console.error('Error loading KML', error);
            showToast('Error al cargar el mapa', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Mapa de Territorios</h3>
            </div>
            <div className="card-body">
                <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer
                        center={[19.4326, -99.1332]} // Default Mexico City
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {geoJsonData && (
                            <>
                                <GeoJSON
                                    data={geoJsonData}
                                    style={{
                                        color: '#3388ff',
                                        weight: 2,
                                        opacity: 0.8,
                                        fillOpacity: 0.3
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        if (feature.properties && feature.properties.name) {
                                            layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
                                        }
                                    }}
                                />
                                <FitBounds geoData={geoJsonData} />
                            </>
                        )}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;
