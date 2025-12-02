import express from 'express';
import AuthController from './controller.mjs';
const router = express.Router();
router.post('/signup', AuthController.register);
router.post('/login', AuthController.login);
export default router;