import express from 'express';
import { createSuperAdminRequest, getOwnerRequests } from '../controllers/superAdminRequestController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// Only owners can access these routes
router.post('/super-admin-handling', requireRole(['owner']), createSuperAdminRequest);
router.get('/my-requests', requireRole(['owner']), getOwnerRequests);

export default router;
