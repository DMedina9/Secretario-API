import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const PublicadorCard = ({ publicador, onClose }) => {
    const cardRef = useRef(null);

    const handleDownload = async () => {
        if (!cardRef.current) return;

        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null, // Transparent background if possible, or style it
                scale: 2 // Higher resolution
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `Tarjeta_${publicador.nombre}_${publicador.apellidos}.png`;
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
        }
    };

    if (!publicador) return null;

    // Helper to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper for boolean badges
    const getBadges = () => {
        const items = [];
        if (publicador.ungido) items.push('Ungido');
        if (publicador.sordo) items.push('Sordo');
        if (publicador.ciego) items.push('Ciego');
        if (publicador.encarcelado) items.push('Encarcelado');
        return items;
    };

    // Helper for Type
    const getType = () => {
        switch (publicador.id_tipo_publicador) {
            case 1: return 'Publicador';
            case 2: return 'Precursor Regular';
            case 3: return 'Precursor Auxiliar';
            default: return 'Desconocido';
        }
    };

    // Helper for Privilege
    const getPrivilege = () => {
        switch (publicador.id_privilegio) {
            case 1: return 'Anciano';
            case 2: return 'Siervo Ministerial';
            default: return null;
        }
    };

    return (
        <div className="flex flex-col gap-md">
            <div
                ref={cardRef}
                style={{
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    borderRadius: '12px',
                    color: '#333',
                    maxWidth: '400px',
                    margin: '0 auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontFamily: 'var(--font-family)',
                    position: 'relative'
                }}
            >
                <div style={{ borderBottom: '2px solid #666', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1a1a1a', fontWeight: 'bold' }}>{publicador.nombre} {publicador.apellidos}</h2>
                    <span style={{
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        background: '#2c3e50',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                    }}>
                        {getType()}
                    </span>
                </div>

                <div style={{ display: 'grid', gap: '0.8rem', fontSize: '0.95rem' }}>
                    {getPrivilege() && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                            <strong style={{ color: '#555' }}>Privilegio:</strong>
                            <span style={{ fontWeight: '600' }}>{getPrivilege()}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                        <strong style={{ color: '#555' }}>Grupo:</strong>
                        <span style={{ fontWeight: '600' }}>{publicador.grupo} {publicador.sup_grupo === 1 ? '(Sup)' : publicador.sup_grupo === 2 ? '(Aux)' : ''}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                        <strong style={{ color: '#555' }}>Tel. Móvil:</strong>
                        <span style={{ fontWeight: '600' }}>{publicador.telefono_movil || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                        <strong style={{ color: '#555' }}>Tel. Fijo:</strong>
                        <span style={{ fontWeight: '600' }}>{publicador.telefono_fijo || 'N/A'}</span>
                    </div>

                    {publicador.fecha_nacimiento && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                            <strong style={{ color: '#555' }}>Nacimiento:</strong>
                            <span style={{ fontWeight: '600' }}>{formatDate(publicador.fecha_nacimiento)}</span>
                        </div>
                    )}

                    {publicador.fecha_bautismo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem' }}>
                            <strong style={{ color: '#555' }}>Bautismo:</strong>
                            <span style={{ fontWeight: '600' }}>{formatDate(publicador.fecha_bautismo)}</span>
                        </div>
                    )}

                    {/* Dirección */}
                    {(publicador.calle || publicador.colonia) && (
                        <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #999', paddingTop: '0.5rem' }}>
                            <strong style={{ display: 'block', color: '#1a1a1a', marginBottom: '0.2rem' }}>Dirección:</strong>
                            <div style={{ fontSize: '0.9rem', color: '#444' }}>
                                {publicador.calle} {publicador.num && `#${publicador.num}`}
                                {publicador.colonia && <><br />{publicador.colonia}</>}
                            </div>
                        </div>
                    )}

                    {/* Contacto de Emergencia */}
                    {(publicador.contacto_emergencia || publicador.tel_contacto_emergencia) && (
                        <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #999', paddingTop: '0.5rem' }}>
                            <strong style={{ display: 'block', color: '#b91c1c', marginBottom: '0.2rem', fontSize: '0.85rem' }}>🚑 Emergencia:</strong>
                            {publicador.contacto_emergencia && (
                                <div style={{ fontWeight: '600', color: '#333' }}>{publicador.contacto_emergencia}</div>
                            )}
                            {publicador.tel_contacto_emergencia && (
                                <div style={{ fontSize: '0.9rem' }}>📞 {publicador.tel_contacto_emergencia}</div>
                            )}
                            {publicador.correo_emergencia && (
                                <div style={{ fontSize: '0.9rem' }}>📧 {publicador.correo_emergencia}</div>
                            )}
                        </div>
                    )}

                    {getBadges().length > 0 && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {getBadges().map(badge => (
                                    <span key={badge} style={{
                                        fontSize: '0.75rem',
                                        background: '#e0e7ff',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        color: '#3730a3',
                                        fontWeight: '600',
                                        border: '1px solid #c7d2fe'
                                    }}>
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        Congregación Jardines de Andalucía
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-sm mt-md">
                <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                <button className="btn btn-primary" onClick={handleDownload}>
                    📸 Descargar Imagen
                </button>
            </div>
        </div>
    );
};

export default PublicadorCard;
