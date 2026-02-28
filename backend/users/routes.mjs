import express from 'express';
import UserController from './controller.mjs';
import { check } from '../common/middlewares/IsAuthenticated.mjs';
import { has } from '../common/middlewares/CheckPermission.mjs';

const router = express.Router();

router.get('/', check, UserController.getUser);
router.get('/all', check, has('admin'), UserController.getAllUsers);
router.post('/', check, has('admin'), UserController.createUser);
router.put('/:id', check, has('admin'), UserController.updateUser);
router.delete('/:id', check, has('admin'), UserController.deleteUser);

export default router;