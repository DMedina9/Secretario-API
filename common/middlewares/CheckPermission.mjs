import sequelize from '../database.mjs';
import defineUser from '../models/User.mjs';
const User = defineUser(sequelize);

export const has = (requiredRole) => async (req, res, next) => {
    const user = await User.findByPk(req.user.userId);
    if (!user || user.role !== requiredRole) {
        return res.status(403).json({ error: `Requires ${requiredRole} role` });
    }
    next();
};