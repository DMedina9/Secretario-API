import express from 'express';
import UserController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';

const router = express.Router();

router.get('/', check, UserController.getUser);
router.get('/all', check, has('ADMIN'), UserController.getAllUsers);

export default router;