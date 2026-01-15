import sequelize from '../database.mjs';
import defineUser from '../models/User.mjs';
const User = defineUser(sequelize);

const roles = {
    admin: 100,
    user: 1
}
export const has = (requiredRole) => async (req, res, next) => {
    const user = await User.findByPk(req.user.userId);
    if (!user || user.role < roles[requiredRole]) {
        return res.status(403).json({ error: `No tienes permiso para acceder a esta ruta` });
    }
    next();
};