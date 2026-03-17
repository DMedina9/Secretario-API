import React, { useState } from 'react';
import dayjs from 'dayjs';
import { apiRequest } from '../utils/api';
import { useAnioServicio } from '../contexts/AnioServicioContext';
import { useToast } from '../contexts/ToastContext';
import Loading from '../components/Common/Loading';

const PrecursoresRegulares = () => {
    const { anioServicio } = useAnioServicio();
    const { showToast } = useToast();

    const [filterAnio, setFilterAnio] = useState(anioServicio || dayjs().year());
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const loadPrecursores = async () => {
        if (!filterAnio) {
            showToast('Seleccione un año de servicio', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await apiRequest(`/informe/precursoresRegulares/${filterAnio}`);
            if (response && response.data) {
                setData(response.data);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(error);
            showToast('Error al cargar precursores regulares', 'error');
        } finally {
            setLoading(false);
        }
    };

    const clear = () => {
        setFilterAnio(anioServicio || dayjs().year());
        setData([]);
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Precursores Regulares</h1>
                <p className="page-description">Reporte de precursores regulares</p>
            </div>

            <div className="card mb-lg">
                <div className="card-header">
                    <h3 className="card-title">Filtros</h3>
                </div>
                <div className="card-body">
                    <div className="grid grid-cols-2 gap-md">
                        <div className="form-group">
                            <label className="form-label">Año de Servicio</label>
                            <input
                                type="number"
                                className="form-input"
                                value={filterAnio}
                                onChange={(e) => setFilterAnio(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-sm mt-md">
                        <button className="btn btn-secondary" onClick={clear}>Limpiar</button>
                        <button className="btn btn-primary" onClick={loadPrecursores}>Buscar</button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Reporte de Precursores Regulares</h3>
                </div>
                <div className="card-body">
                    {loading ? <Loading /> : (
                        <div className="table-container">
                            {data.length === 0 ? (
                                <p className="text-center text-muted">No hay datos. Aplica filtros y busca.</p>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Inicio (mes)</th>
                                            <th>Años</th>
                                            <th>Meses</th>
                                            <th>Sep</th>
                                            <th>Oct</th>
                                            <th>Nov</th>
                                            <th>Dic</th>
                                            <th>Ene</th>
                                            <th>Feb</th>
                                            <th>Mar</th>
                                            <th>Abr</th>
                                            <th>May</th>
                                            <th>Jun</th>
                                            <th>Jul</th>
                                            <th>Ago</th>
                                            <th>Suma</th>
                                            <th>Promedio</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item) => (
                                            <tr key={`${item.id}-${item.publicador}`}>
                                                <td data-label="Nombre">{item.publicador}</td>
                                                <td data-label="Inicio">{item.inicio_precursorado ? dayjs(item.inicio_precursorado).format('DD/MM/YYYY') : '-'}</td>
                                                <td data-label="Años">{item.anios_precursorado ?? '-'}</td>
                                                <td data-label="Meses">{item.meses ?? '-'}</td>
                                                <td data-label="Sep">{item.sep}</td>
                                                <td data-label="Oct">{item.oct}</td>
                                                <td data-label="Nov">{item.nov}</td>
                                                <td data-label="Dic">{item.dic}</td>
                                                <td data-label="Ene">{item.ene}</td>
                                                <td data-label="Feb">{item.feb}</td>
                                                <td data-label="Mar">{item.mar}</td>
                                                <td data-label="Abr">{item.abr}</td>
                                                <td data-label="May">{item.may}</td>
                                                <td data-label="Jun">{item.jun}</td>
                                                <td data-label="Jul">{item.jul}</td>
                                                <td data-label="Ago">{item.ago}</td>
                                                <td data-label="Suma">{item.suma}</td>
                                                <td data-label="Promedio">{item.promedio}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrecursoresRegulares;
