import express from 'express';
import { initDb } from './common/models/Secretario.mjs';
import authRoutes from './authorization/routes.mjs';
import userRoutes from './users/routes.mjs';
import publicadorRoutes from './publicador/routes.mjs';
import informeRoutes from './informe/routes.mjs';
import asistenciasRoutes from './asistencias/routes.mjs';
import dotenv from 'dotenv';
dotenv.config();

initDb();
const app = express();

app.use(express.json());
app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/publicador', publicadorRoutes);
app.use('/informe', informeRoutes);
app.use('/asistencias', asistenciasRoutes);
app.get('/status', (req, res) => {
    res.json({
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong'
    });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));