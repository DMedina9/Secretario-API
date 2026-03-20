import { getDb } from '../Database';

export const getInformesByPublicadorAndAnio = async (id_publicador, anio_servicio) => {
    const db = await getDb();
    const desde = `${anio_servicio - 1}-09-01`;
    const hasta = `${anio_servicio}-08-31`;
    return await db.getAllAsync(`
        SELECT * FROM informes 
        WHERE id_publicador = ? AND mes BETWEEN ? AND ?
        ORDER BY mes ASC
    `, [id_publicador, desde, hasta]);
};

export const getPrecursoresRegulares = async (anio_servicio) => {
    const db = await getDb();
    const desde = `${anio_servicio - 1}-09-01`;
    const hasta = `${anio_servicio}-08-31`;

    const rows = await db.getAllAsync(`
        SELECT 
            p.id, p.nombre || ' ' || p.apellidos as publicador,
            i.mes, i.horas, i.horas_SS
        FROM informes i
        JOIN publicadores p ON i.id_publicador = p.id
        WHERE p.tipo_publicador = 'Precursor regular'
          AND i.mes BETWEEN ? AND ?
        ORDER BY p.apellidos, p.nombre, i.mes
    `, [desde, hasta]);

    // Group by publisher
    const grouped = {};
    rows.forEach(r => {
        if (!grouped[r.id]) {
            grouped[r.id] = { id: r.id, publicador: r.publicador, suma: 0, meses: 0 };
        }
        const m = r.mes.substring(5, 7);
        const monthMap = { '09': 'sep', '10': 'oct', '11': 'nov', '12': 'dic', '01': 'ene', '02': 'feb', '03': 'mar', '04': 'abr', '05': 'may', '06': 'jun', '07': 'jul', '08': 'ago' };
        const monthKey = monthMap[m];
        if (monthKey) {
            const h = r.horas || 0;
            const hss = r.horas_SS || 0;
            // logic from backend: i.horas + MAX(0, MIN(55 - i.horas, IFNULL(i.horas_SS, 0)))
            const totalH = h + Math.max(0, Math.min(55 - h, hss));
            grouped[r.id][monthKey] = totalH;
            grouped[r.id].suma += totalH;
            grouped[r.id].meses += 1;
        }
    });

    return Object.values(grouped).map(g => ({
        ...g,
        promedio: g.meses > 0 ? g.suma / g.meses : 0
    }));
};

export const getIrregulares = async (mes) => {
    const db = await getDb();
    // Fetch all publishers that should be irregular
    // Simplification: Inactives (0 reports in last 6) or Irregulars (< 6 reports in last 6)
    const months = [];
    for (let i = 0; i < 6; i++) {
        months.push(dayjs(mes).subtract(5, 'month').add(i, 'month').format('YYYY-MM'));
    }

    const rows = await db.getAllAsync(`
        SELECT p.id, p.nombre, p.apellidos, p.nombre || ' ' || p.apellidos as publicador, p.Estatus
        FROM publicadores p
    `);

    // Fetch reports for these publishers in the last 6 months
    const reports = await db.getAllAsync(`
        SELECT id_publicador, mes, predico_en_el_mes
        FROM informes
        WHERE mes BETWEEN date(?, '-6 months') AND ?
    `, [mes, mes]);

    const result = [];
    rows.forEach(p => {
        const pubReports = reports.filter(r => r.id_publicador === p.id);
        const predicados = pubReports.filter(r => r.predico_en_el_mes === 1).length;
        
        if (predicados < 6) {
            const detailMeses = months.map(m => {
                const inf = pubReports.find(r => r.mes.startsWith(m));
                return { mes: m, predico: inf ? !!inf.predico_en_el_mes : false };
            });

            let consecutivos = 0;
            let current = 6;
            for (let i = 0; i < detailMeses.length; i++) {
                if (detailMeses[i].predico) {
                    current = 5 - i;
                }
            }
            consecutivos = current;

            result.push({
                ...p,
                meses_predicados: predicados,
                meses_faltantes: 6 - predicados,
                consecutivos_sin_predicar: consecutivos,
                detalle_meses: detailMeses
            });
        }
    });

    return result.sort((a, b) => b.Estatus.localeCompare(a.Estatus) || a.apellidos.localeCompare(b.apellidos));
};

export const getPrecursoresAuxiliaresByMonth = async (anio_servicio, mes) => {
    const db = await getDb();
    const mesStr = `${anio_servicio}-${mes}-01`; // This depends on how it's stored, I'll use the YYYY-MM-01 format
    return await db.getAllAsync(`
        SELECT * FROM precursores_auxiliares 
        WHERE anio_servicio = ? AND mes LIKE ?
    `, [anio_servicio, `%-${mes}-%`]);
};
