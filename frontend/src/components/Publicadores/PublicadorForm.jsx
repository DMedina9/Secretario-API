import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';

const PublicadorForm = ({ isOpen, onClose, onSubmit, publicador, title = "Publicador" }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        fecha_nacimiento: '',
        fecha_bautismo: '',
        grupo: '',
        sup_grupo: '',
        sexo: 'H',
        id_tipo_publicador: '1',
        id_privilegio: '',
        ungido: false,
        sordo: false,
        ciego: false,
        encarcelado: false,
        calle: '',
        num: '',
        colonia: '',
        telefono_fijo: '',
        telefono_movil: '',
        contacto_emergencia: '',
        tel_contacto_emergencia: '',
        correo_contacto_emergencia: ''
    });

    useEffect(() => {
        if (publicador) {
            setFormData({
                ...publicador,
                id_tipo_publicador: publicador.id_tipo_publicador?.toString() || '1',
                id_privilegio: publicador.id_privilegio?.toString() || '',
                sup_grupo: publicador.sup_grupo?.toString() || '',
                ungido: !!publicador.ungido,
                sordo: !!publicador.sordo,
                ciego: !!publicador.ciego,
                encarcelado: !!publicador.encarcelado
            });
        } else {
            // Reset form for new user
            setFormData({
                nombre: '',
                apellidos: '',
                fecha_nacimiento: '',
                fecha_bautismo: '',
                grupo: '',
                sup_grupo: '',
                sexo: 'H',
                id_tipo_publicador: '1',
                id_privilegio: '',
                ungido: false,
                sordo: false,
                ciego: false,
                encarcelado: false,
                calle: '',
                num: '',
                colonia: '',
                telefono_fijo: '',
                telefono_movil: '',
                contacto_emergencia: '',
                tel_contacto_emergencia: '',
                correo_contacto_emergencia: ''
            });
        }
    }, [publicador, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...formData };

        // Convert numbers
        data.id_tipo_publicador = parseInt(data.id_tipo_publicador);
        if (data.id_privilegio) data.id_privilegio = parseInt(data.id_privilegio);
        else data.id_privilegio = null;

        // Convert checkbox booleans to 1/0 if backend expects that (the original code used checked ? 1 : 0 inside updatePublicador but here we'll send what api expects)
        // Original savePublicador sent the whole object. Let's assume backend handles booleans or we should convert them.
        // sequelize/sqlite usually takes 1/0 for boolean but often libs handle true/false.
        // The original code was using checkboxes and `checked` directly in the form but `this.checked ? 1 : 0` in inline edit.
        // Let's send 1/0 just to be safe if that's what the DB is storing as integer/tinyint.

        // Actually, looking at original code: `data.id_tipo_publicador = parseInt(data.id_tipo_publicador);`
        // It didn't explicitly convert boolean fields in the form submit handler (lines 500+ of publicadores.js), so `FormData` would send "on" or nothing? 
        // Wait, `Object.fromEntries(formData.entries())` would have 'on' for checked checkboxes if not careful.
        // But the original code manually handled the select parsing.
        // And for checkboxes: `<input type="checkbox" name="ungido" ...>`
        // If checked, formData has 'ungido': 'on'. If not, it's missing.
        // The original code might have been buggy or backend handles 'on'.
        // BUT inline edit used `this.checked ? 1 : 0`.

        // Let's clean it up to be safe: send 1/0 or true/false
        data.ungido = data.ungido ? 1 : 0;
        data.sordo = data.sordo ? 1 : 0;
        data.ciego = data.ciego ? 1 : 0;
        data.encarcelado = data.encarcelado ? 1 : 0;

        onSubmit(data);
    };

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={onClose} type="button">Cancelar</button>
            <button className="btn btn-primary" form="publicadorForm" type="submit">
                {publicador ? 'Actualizar' : 'Guardar'}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={publicador ? 'Editar Publicador' : 'Agregar Publicador'}
            footer={footer}
        >
            <form id="publicadorForm" onSubmit={handleSubmit} className="grid grid-cols-2 gap-md">
                <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-input" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Apellidos</label>
                    <input type="text" className="form-input" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input type="date" className="form-input" name="fecha_nacimiento" value={formData.fecha_nacimiento || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Bautismo</label>
                    <input type="date" className="form-input" name="fecha_bautismo" value={formData.fecha_bautismo || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Grupo</label>
                    <input type="number" className="form-input" name="grupo" value={formData.grupo} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Sup Grupo</label>
                    <select className="form-select" name="sup_grupo" value={formData.sup_grupo} onChange={handleChange} required>
                        <option value="">Seleccione</option>
                        <option value="1">Sup</option>
                        <option value="2">Aux</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Sexo</label>
                    <select className="form-select" name="sexo" value={formData.sexo} onChange={handleChange} required>
                        <option value="H">Masculino</option>
                        <option value="M">Femenino</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Tipo de Publicador</label>
                    <select className="form-select" name="id_tipo_publicador" value={formData.id_tipo_publicador} onChange={handleChange} required>
                        <option value="1">Publicador</option>
                        <option value="2">Precursor Regular</option>
                        <option value="3">Precursor Auxiliar</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Privilegio</label>
                    <select className="form-select" name="id_privilegio" value={formData.id_privilegio} onChange={handleChange}>
                        <option value="">Ninguno</option>
                        <option value="1">Anciano</option>
                        <option value="2">Siervo Ministerial</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 col-span-2 gap-md">
                    <div className="form-group">
                        <label className="form-label">Ungido</label>
                        <label className="switch">
                            <input type="checkbox" name="ungido" checked={formData.ungido} onChange={handleChange} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sordo</label>
                        <label className="switch">
                            <input type="checkbox" name="sordo" checked={formData.sordo} onChange={handleChange} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Ciego</label>
                        <label className="switch">
                            <input type="checkbox" name="ciego" checked={formData.ciego} onChange={handleChange} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Encarcelado</label>
                        <label className="switch">
                            <input type="checkbox" name="encarcelado" checked={formData.encarcelado} onChange={handleChange} />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Calle</label>
                    <input type="text" className="form-input" name="calle" value={formData.calle || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Num</label>
                    <input type="text" className="form-input" name="num" value={formData.num || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Colonia</label>
                    <input type="text" className="form-input" name="colonia" value={formData.colonia || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Telefono Fijo</label>
                    <input type="tel" className="form-input" name="telefono_fijo" value={formData.telefono_fijo || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Telefono Movil</label>
                    <input type="tel" className="form-input" name="telefono_movil" value={formData.telefono_movil || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Contacto Emergencia</label>
                    <input type="text" className="form-input" name="contacto_emergencia" value={formData.contacto_emergencia || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Tel Contacto Emergencia</label>
                    <input type="tel" className="form-input" name="tel_contacto_emergencia" value={formData.tel_contacto_emergencia || ''} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Correo Contacto Emergencia</label>
                    <input type="email" className="form-input" name="correo_contacto_emergencia" value={formData.correo_contacto_emergencia || ''} onChange={handleChange} />
                </div>
            </form>
        </Modal>
    );
};

export default PublicadorForm;
