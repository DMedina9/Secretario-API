import express from 'express';
import cors from 'cors';
import { initDb } from './common/models/Secretario.mjs';
import authRoutes from './authorization/routes.mjs';
import userRoutes from './users/routes.mjs';
import publicadorRoutes from './publicador/routes.mjs';
import informeRoutes from './informe/routes.mjs';
import asistenciasRoutes from './asistencias/routes.mjs';
import secretarioRoutes from './secretario/routes.mjs';
import fillPDFRoutes from './fillPDF/routes.mjs';
import territoriosRoutes from './territorios/routes.mjs';
import configuracionesRoutes from './configuraciones/routes.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDb();
const app = express();

// Enable CORS for all routes
//Desarrollo:
//app.use(cors());
//Producción:
app.use(cors({
    origin: ['https://dmedina9.github.io', 'https://secretario-api.onrender.com'],
    credentials: true
}));
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use('/api/account', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/publicador', publicadorRoutes);
app.use('/api/informe', informeRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/secretario', secretarioRoutes);
app.use('/api/fillPDF', fillPDFRoutes);
app.use('/api/territorios', territoriosRoutes);
app.use('/api/configuraciones', configuracionesRoutes);
app.get('/api/status', (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});
app.use('/', express.static(path.join(__dirname, '../frontend/dist')));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));