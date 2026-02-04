import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import dayjs from 'dayjs';

const AsistenciaForm = ({ isOpen, onClose, onSubmit, asistencia, title = "Registrar Asistencia", onDelete }) => {
    const [formData, setFormData] = useState({
        fecha: dayjs().format('YYYY-MM-DD'),
        asistentes: '',
        notas: ''
    });

    useEffect(() => {
        if (asistencia) {
            setFormData({
                fecha: asistencia.fecha ? dayjs(asistencia.fecha).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                asistentes: asistencia.asistentes || '',
                notas: asistencia.notas || ''
            });
        }
    }, [asistencia, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData };
        data.asistentes = parseInt(data.asistentes);
        // fecha is already formatted
        onSubmit(data);
    };

    const footer = (
        <div className="flex justify-between items-center w-full">
            {onDelete ? (
                <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={onDelete}
                >
                    Eliminar
                </button>
            ) : <div></div>}

            <div className="flex gap-sm">
                <button className="btn btn-secondary" onClick={onClose} type="button">Cancelar</button>
                <button className="btn btn-primary" form="asistenciaForm" type="submit">
                    {asistencia && asistencia.id ? 'Actualizar' : 'Guardar'}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={footer}
        >
            <form id="asistenciaForm" onSubmit={handleSubmit} className="flex flex-col gap-md">
                <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input
                        type="date"
                        className="form-input"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Número de Asistentes</label>
                    <input
                        type="number"
                        className="form-input"
                        name="asistentes"
                        min="0"
                        value={formData.asistentes}
                        onChange={handleChange}
                        required
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Notas</label>
                    <textarea
                        className="form-input"
                        name="notas"
                        rows="3"
                        value={formData.notas}
                        onChange={handleChange}
                    />
                </div>
            </form>
        </Modal>
    );
};

export default AsistenciaForm;
