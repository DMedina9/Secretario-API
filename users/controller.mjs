import sequelize from '../common/database.mjs';
import defineUser from '../common/models/User.mjs';
const User = defineUser(sequelize);

const getUser = async (req, res) => {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: user });
};

const getAllUsers = async (req, res) => {
    const users = await User.findAll();
    res.json({ success: true, data: users });
};

const createUser = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName) {
            return res.json({ success: false, error: 'Todos los campos son requeridos' });
        }

        // Hash password (simple hash - in production use bcrypt)
        const hashedPassword = Buffer.from(password).toString('base64');

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: role || 'USER'
        });

        res.json({ success: true, message: 'Usuario creado exitosamente', data: user });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, firstName, lastName, role, password } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }

        // Update fields
        if (username) user.username = username;
        if (email) user.email = email;
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (role) user.role = role;
        if (password) {
            // Hash new password
            user.password = Buffer.from(password).toString('base64');
        }

        await user.save();

        res.json({ success: true, message: 'Usuario actualizado exitosamente', data: user });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.json({ success: false, error: 'Usuario no encontrado' });
        }

        await user.destroy();

        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
};

export default { getUser, getAllUsers, createUser, updateUser, deleteUser };