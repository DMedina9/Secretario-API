import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sequelize from '../common/database.mjs';
import defineUser from '../common/models/User.mjs';
import Ajv from 'ajv';
const ajv = new Ajv();
const schema = {
    type: 'object',
    required: ['username', 'email', 'password', 'firstName', 'lastName', 'age'],
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 20 },
        email: { type: 'string', minLength: 5, maxLength: 100 },
        password: { type: 'string', minLength: 6, maxLength: 20 },
        firstName: { type: 'string', minLength: 3, maxLength: 20 },
        lastName: { type: 'string', minLength: 3, maxLength: 20 },
        age: { type: 'integer', minimum: 18, maximum: 120 }
    }
};
const validate = ajv.compile(schema);
const User = defineUser(sequelize);

const encryptPassword = (password) =>
    crypto.createHash('sha256').update(password).digest('hex');

const generateAccessToken = (username, userId) =>
    jwt.sign({ username, userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

const register = async (req, res) => {
    try {
        if (!validate(req.body)) {
            return res.status(400).json({ error: 'Invalid input', details: validate.errors });
        }
        const { username, email, password, firstName, lastName, age } = req.body;
        const encryptedPassword = encryptPassword(password);
        const user = await User.create({
            username,
            email,
            password: encryptedPassword,
            firstName,
            lastName,
            age
        });
        const accessToken = generateAccessToken(username, user.id);
        res.status(201).json({
            success: true,
            user: { id: user.id, username: user.username, email: user.email },
            token: accessToken
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
const login = async (req, res) => {
    const { username, password } = req.body;
    const encrypted = encryptPassword(password);
    const user = await User.findOne({ where: { username } });

    if (!user || user.password !== encrypted)
        return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateAccessToken(username, user.id);
    res.json({ success: true, user, token });
};
export default { register, login };