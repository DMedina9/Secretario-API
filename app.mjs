import express from 'express';
import sequelize from './common/database.mjs';
import defineUser from './common/models/User.mjs';
import authRoutes from './authorization/routes.mjs';
//const User = defineUser(sequelize);
import userRoutes from './users/routes.mjs';

sequelize.sync();
const app = express();

app.use(express.json());
app.use('/', authRoutes);
app.use('/user', userRoutes);
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