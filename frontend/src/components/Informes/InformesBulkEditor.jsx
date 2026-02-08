import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';

const InformesBulkEditor = () => {
    const [month, setMonth] = useState(dayjs().add(-1, 'month').format('YYYY-MM'));
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [bulkData, setBulkData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const data = await apiRequest('/publicador/all');
            if (data && data.data) {
                // Extract unique groups
                const uniqueGroups = [...new Set(data.data.map(p => p.grupo).filter(g => g))];
                uniqueGroups.sort((a, b) => a - b);
                setGroups(uniqueGroups);
            }
        } catch (error) {
            console.error('Error loading groups', error);
        }
    };

    const loadBulkData = async () => {
        if (!month || !selectedGroup) {
            showToast('Por favor selecciona mes y grupo', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Load publicadores for group
            const pubData = await apiRequest(`/publicador/grupo/${selectedGroup}`);
            const publicadores = pubData.data;

            if (!publicadores || publicadores.length === 0) {
                showToast('No hay publicadores en este grupo', 'warning');
                setBulkData([]);
                setLoading(false);
                return;
            }

            // Load existing informes for the month
            const year = dayjs(month).year() + (dayjs(month).month() >= 8 ? 1 : 0); // Service year... wait.
            // Original code:
            // const monthDate = dayjs(month + '-01');
            // let year = monthDate.year();
            // if (monthDate.month() >= 8) year++;

            // Actually the endpoint is /informe/:id/:anio/:mes
            // But usually we query by service year?
            // Let's look at original code line 481: `/informe/${pub.id}/${year}/${month.substring(5, 7)}`
            // month.substring(5, 7) is "MM".

            const monthDate = dayjs(month + '-01');
            let serviceYear = monthDate.year();
            if (monthDate.month() >= 8) serviceYear++;

            const monthStr = month.substring(5, 7);

            // We need to fetch existing informes for EACH publicador in the group?
            // The original code loops through publicadores and fetches one by one. That's inefficient but we must follow it if no bulk get endpoint exists.
            // Is there a bulk fetch? seemingly not in the original code.

            const existingInformes = {};

            // Parallelize requests for better performance
            await Promise.all(publicadores.map(async (pub) => {
                try {
                    const informeData = await apiRequest(`/informe/${pub.id}/${serviceYear}/${monthStr}`);
                    if (informeData && informeData.data) {
                        // The endpoint returns array of informes for that year/month? Or just one?
                        // Original code finds: `informeData.data.find(i => ...)`
                        // So likely returns list for that month or year.
                        const found = informeData.data.find(i => {
                            return dayjs(i.mes).format('YYYY-MM') === month;
                        });
                        if (found) {
                            existingInformes[pub.id] = found;
                        }
                    }
                } catch (e) {
                    // ignore
                }
            }));

            // Prepare bulk data
            // Sort logic from original: Precursores Regulares first
            const sortedPubs = publicadores.sort((a, b) => {
                // id_tipo_publicador: 1=Pub, 2=RP, 3=Aux
                // (a % 2) -> RP=0, Others=1.
                const valA = (a.id_tipo_publicador % 2);
                const valB = (b.id_tipo_publicador % 2);
                if (valA !== valB) return valA - valB; // 0 (RP) comes before 1

                // Then name
                const nameA = `${a.apellidos}, ${a.nombre}`;
                const nameB = `${b.apellidos}, ${b.nombre}`;
                return nameA.localeCompare(nameB);
            });

            const newData = sortedPubs.map(pub => {
                const existing = existingInformes[pub.id];
                return {
                    id_publicador: pub.id,
                    nombre: `${pub.apellidos}, ${pub.nombre}`,
                    telefono: pub.telefono_movil, // for whatsapp
                    mes: month + '-01',
                    predico_en_el_mes: existing ? existing.predico_en_el_mes : 0,
                    horas: existing ? existing.horas : 0,
                    cursos_biblicos: existing ? existing.cursos_biblicos : 0,
                    id_base_tipo: pub.id_tipo_publicador, // To know which switch to disable
                    id_tipo_publicador: existing ? existing.id_tipo_publicador : (pub.id_tipo_publicador || 1),
                    notas: existing ? existing.notas : ''
                };
            });

            setBulkData(newData);

        } catch (error) {
            console.error(error);
            showToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        setBulkData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const handleSave = async () => {
        if (bulkData.length === 0) return;

        setLoading(true);
        try {
            // Map to API structure
            const payload = bulkData.map(item => ({
                id_publicador: item.id_publicador,
                mes: item.mes,
                predico_en_el_mes: item.predico_en_el_mes ? 1 : 0, // Ensure int
                horas: parseInt(item.horas) || 0,
                cursos_biblicos: parseInt(item.cursos_biblicos) || 0,
                id_tipo_publicador: parseInt(item.id_tipo_publicador),
                notas: item.notas
            }));

            const result = await apiRequest('/informe/bulk', {
                method: 'POST', // Original uses POST for bulk update/create
                body: payload
            });

            if (result && result.success) {
                showToast(`✅ ${bulkData.length} informes guardados`, 'success');
                // Maybe clear data or reload? Original clears.
                setBulkData([]);
            }
        } catch (error) {
            showToast('Error al guardar informes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setBulkData([]);
    };

    // Helper to render section dividers
    const isFirstOfType = (index, typeId) => {
        if (index === 0) return bulkData[index].id_tipo_publicador === typeId;
        return bulkData[index].id_tipo_publicador === typeId && bulkData[index - 1].id_tipo_publicador !== typeId;
    };
    // The original logic checked against fixed types relative to current item.
    // Original:
    // index == 0 && informe.id_tipo_publicador == 2 -> "Precursores regulares"
    // (index == 0 && id != 2) OR (index > 0 && id != 2 && prev.id == 2) -> "Publicadores"
    // Note: It seems it assumes the sort order is RP first, then others.

    // We already sorted so RP (2) should be at top.

    return (
        <div>
            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">✏️ Editor de Informes</h3>
                    <p className="card-subtitle">Edita múltiples informes simultáneamente por grupo</p>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-3 gap-lg mb-lg">
                        <div className="form-group">
                            <label className="form-label">Mes</label>
                            <input
                                type="month"
                                className="form-input"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Grupo</label>
                            <select
                                className="form-select"
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                            >
                                <option value="">Seleccionar grupo</option>
                                {groups.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button className="btn btn-primary w-full" onClick={loadBulkData} disabled={loading}>
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading && <Loading />}

            {bulkData.length > 0 && (
                <div className="card fade-in">
                    <div className="card-body">
                        <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                                    <tr>
                                        <th style={{ minWidth: '150px' }}>Publicador</th>
                                        <th style={{ width: '100px' }}>WhatsApp</th>
                                        <th style={{ width: '100px' }}>Predicó</th>
                                        <th style={{ width: '100px' }}>Cursos</th>
                                        <th style={{ width: '100px' }}>Precursor Aux.</th>
                                        <th style={{ width: '100px' }}>Horas</th>
                                        <th style={{ minWidth: '150px' }}>Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.map((item, index) => (
                                        <React.Fragment key={item.id_publicador}>
                                            {/* Section Headers */}
                                            {index === 0 && item.id_tipo_publicador === 2 && (
                                                <tr className="header">
                                                    <th colSpan="7" className="text-center bg-primary text-white">Precursores regulares</th>
                                                </tr>
                                            )}
                                            {/* Logic for Publicadores Header: if first item is NOT RP, OR if previous was RP and current is NOT */}
                                            {((index === 0 && item.id_tipo_publicador !== 2) ||
                                                (index > 0 && item.id_tipo_publicador !== 2 && bulkData[index - 1].id_tipo_publicador === 2)) && (
                                                    <tr className="header">
                                                        <th colSpan="7" className="text-center bg-primary text-white">Publicadores</th>
                                                    </tr>
                                                )}

                                            <tr>
                                                <td data-label="Publicador"><strong>{item.nombre}</strong></td>
                                                <td data-label="WhatsApp" className="text-center">
                                                    {(!item.predico_en_el_mes && item.telefono) && (
                                                        <a
                                                            href={`https://wa.me/${item.telefono}?text=Hola%2C%20buen%20d%C3%ADa!%20Me%20puede%20mandar%20su%20informe%20de%20${dayjs(month + '-01').format('MMMM YYYY')}%2C%20por%20favor%3F%20Saludos!`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-primary hover:underline"
                                                        >
                                                            {item.telefono}
                                                        </a>
                                                    )}
                                                </td>
                                                <td data-label="Predicó" className="text-center">
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!item.predico_en_el_mes}
                                                            onChange={(e) => handleFieldChange(index, 'predico_en_el_mes', e.target.checked ? 1 : 0)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </td>
                                                <td data-label="Cursos" className="text-center">
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        hidden={!item.predico_en_el_mes}
                                                        value={item.cursos_biblicos || ''}
                                                        min="0"
                                                        onChange={(e) => handleFieldChange(index, 'cursos_biblicos', parseInt(e.target.value) || 0)}
                                                        style={{ padding: '0.4rem' }}
                                                    />
                                                </td>
                                                <td data-label="Precursor Aux." className="text-center">
                                                    <label className="switch" style={{ visibility: !item.predico_en_el_mes || item.id_base_tipo === 2 ? 'hidden' : 'visible' }}>
                                                        <input
                                                            type="checkbox"
                                                            disabled={!item.predico_en_el_mes || item.id_base_tipo === 2}
                                                            checked={item.id_tipo_publicador === 3}
                                                            onChange={(e) => handleFieldChange(index, 'id_tipo_publicador', e.target.checked ? 3 : 1)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                </td>
                                                <td data-label="Horas" className="text-center">
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        hidden={!item.predico_en_el_mes || item.id_tipo_publicador === 1}
                                                        value={item.predico_en_el_mes && item.id_tipo_publicador != 1 && item.horas || ''}
                                                        min="0"
                                                        onChange={(e) => handleFieldChange(index, 'horas', parseInt(e.target.value) || 0)}
                                                        style={{ padding: '0.4rem' }}
                                                    />
                                                </td>
                                                <td data-label="Notas" className="text-center">
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        value={item.notas || ''}
                                                        onChange={(e) => handleFieldChange(index, 'notas', e.target.value)}
                                                        style={{ padding: '0.4rem' }}
                                                    />
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end gap-sm mt-lg">
                            <button className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                💾 Guardar Todos ({bulkData.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InformesBulkEditor;
