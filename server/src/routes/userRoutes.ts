import express from 'express';
import { getUsers, createUser, updateUserStatus, updateUser, resetPassword, deleteUser } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['owner']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/status', updateUserStatus);
router.post('/:id/reset-password', resetPassword);
router.delete('/:id', deleteUser);

export default router;
