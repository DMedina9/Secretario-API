import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// Set worker source
// Using CDN for simplicity to avoid build issues with worker file aggregation in Vite without extra config
// Or try to resolve local one.
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
// Actually, let's try the proper Vite import first.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

import { apiRequest, API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useAnioServicio } from '../../contexts/AnioServicioContext';
import { useToast } from '../../contexts/ToastContext';
import Loading from '../Common/Loading';

const PDFViewer = () => {
    const { anioServicio } = useAnioServicio();
    const { getAuthHeaders } = useAuth(); // Assuming I might need raw headers for fetch if apiRequest doesn't return blob
    const { showToast } = useToast();

    // Filters
    const [year, setYear] = useState(anioServicio);
    const [type, setType] = useState('S21I');
    const [publicadorName, setPublicadorName] = useState('');
    const [tipoPublicadorId, setTipoPublicadorId] = useState('');

    // Data lists
    const [publicadores, setPublicadores] = useState([]);
    const [tiposPublicador, setTiposPublicador] = useState([]);

    // PDF State
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pdfBlob, setPdfBlob] = useState(null);
    const [fileName, setFileName] = useState('');

    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

    useEffect(() => {
        loadPublicadores();
        loadTiposPublicador();
    }, []);

    useEffect(() => {
        // Clear PDF when filters change
        // setPdfDoc(null);
        // setPdfBlob(null);
    }, [year, type, publicadorName, tipoPublicadorId]);

    useEffect(() => {
        if (pdfDoc) {
            renderPage(pageNum);
        }
    }, [pdfDoc, pageNum]);

    const loadPublicadores = async () => {
        try {
            const data = await apiRequest('/publicador/all');
            if (data && data.data) {
                setPublicadores(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadTiposPublicador = async () => {
        try {
            const data = await apiRequest('/publicador/tipos-publicador');
            if (data && data.data) {
                setTiposPublicador(data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleViewPDF = async () => {
        if (!year) {
            showToast('Ingresa un año', 'warning');
            return;
        }

        let body = {};
        let endpoint = '';
        let generatedFileName = '';

        if (type === 'S21I') {
            const pub = publicadores.find(p => `${p.nombre} ${p.apellidos}` === publicadorName);
            if (!pub) {
                showToast('Selecciona un publicador válido', 'warning');
                return;
            }
            endpoint = '/fillpdf/get-s21';
            body = { anio: parseInt(year), id_publicador: pub.id };
            generatedFileName = `S21_${year}_${pub.nombre}_${pub.apellidos}.pdf`;
        } else if (type === 'S21T') {
            if (!tipoPublicadorId) {
                showToast('Selecciona un tipo de publicador', 'warning');
                return;
            }
            endpoint = '/fillpdf/get-s21-totales';
            body = { anio: parseInt(year), id_tipo_publicador: parseInt(tipoPublicadorId) };
            const tipoName = tiposPublicador.find(t => t.id == tipoPublicadorId)?.descripcion || 'Totales';
            generatedFileName = `S21_Totales_${year}_${tipoName}.pdf`;
        } else if (type === 'S88') {
            endpoint = `/fillpdf/get-s88/${year}`;
            generatedFileName = `S88_${year}.pdf`;
        }

        setLoading(true);
        try {
            // Need raw fetch for blob
            // apiRequest handles JSON, but we need Blob.
            // We'll reproduce apiRequest logic here or use a helper if available, but simplest is fetch directly.

            const headers = getAuthHeaders();
            let options = {
                headers: { ...headers, 'Content-Type': 'application/json' }
            };

            if (type !== 'S88') {
                options.method = 'POST';
                options.body = JSON.stringify(body);
            } else {
                options.method = 'GET';
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error al descargar PDF');
            }

            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            // Load into PDF.js
            const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            setPdfBlob(blob);
            setFileName(generatedFileName);
            setPdfDoc(loadedPdf);
            setNumPages(loadedPdf.numPages);
            setPageNum(1);
            showToast('PDF cargado', 'success');

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderPage = async (num) => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            const page = await pdfDoc.getPage(num);

            // Cancel previous render if any
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Calculate scale
            const containerWidth = canvas.parentElement.clientWidth || 800;
            const viewport = page.getViewport({ scale: 1 });
            const scale = (Math.min(900, containerWidth) - 32) / viewport.width;
            const scaledViewport = page.getViewport({ scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport
            };

            const renderTask = page.render(renderContext);
            renderTaskRef.current = renderTask;

            await renderTask.promise;
        } catch (error) {
            if (error.name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', error);
            }
        }
    };

    const handleDownload = () => {
        if (!pdfBlob) return;
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="card fade-in">
            <div className="card-header">
                <h3 className="card-title">🔍 Visualizador de PDF</h3>
                <p className="card-subtitle">Visualiza reportes S-21 y S-88 en línea</p>
            </div>
            <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
                    <div className="form-group">
                        <label className="form-label">Año de Servicio</label>
                        <input
                            type="number"
                            className="form-input"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tipo de Reporte</label>
                        <select
                            className="form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="S21I">S-21</option>
                            <option value="S21T">S-21 Totales</option>
                            <option value="S88">S-88</option>
                        </select>
                    </div>

                    {type === 'S21I' && (
                        <div className="form-group">
                            <label className="form-label">Publicador</label>
                            <input
                                className="form-input"
                                list="publicadoresList"
                                value={publicadorName}
                                onChange={(e) => setPublicadorName(e.target.value)}
                                placeholder="Escribe para buscar..."
                            />
                            <datalist id="publicadoresList">
                                {publicadores.map(p => (
                                    <option key={p.id} value={`${p.nombre} ${p.apellidos}`} />
                                ))}
                            </datalist>
                        </div>
                    )}

                    {type === 'S21T' && (
                        <div className="form-group">
                            <label className="form-label">Tipo de Publicador</label>
                            <select
                                className="form-select"
                                value={tipoPublicadorId}
                                onChange={(e) => setTipoPublicadorId(e.target.value)}
                            >
                                <option value="">Seleccionar...</option>
                                {tiposPublicador.map(t => (
                                    <option key={t.id} value={t.id}>{t.descripcion}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex gap-sm mb-lg">
                    <button className="btn btn-primary" onClick={handleViewPDF} disabled={loading}>
                        {loading ? 'Cargando...' : '👁️ Ver PDF'}
                    </button>
                    {pdfBlob && (
                        <button className="btn btn-secondary" onClick={handleDownload}>
                            📥 Descargar
                        </button>
                    )}
                </div>

                {pdfDoc && (
                    <div className="fade-in">
                        {pdfDoc.numPages > 1 && <div className="flex justify-between items-center bg-tertiary p-md rounded-md mb-md">
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setPageNum(Math.max(1, pageNum - 1))}
                                disabled={pageNum <= 1}
                            >
                                ◀ Anterior
                            </button>
                            <span className="font-bold">Página {pageNum} de {numPages}</span>
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => setPageNum(Math.min(numPages, pageNum + 1))}
                                disabled={pageNum >= numPages}
                            >
                                Siguiente ▶
                            </button>
                        </div>
                        }

                        <div className="flex justify-center bg-gray-600 p-md rounded-lg overflow-auto">
                            <canvas
                                ref={canvasRef}
                                className="shadow-lg max-w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;
