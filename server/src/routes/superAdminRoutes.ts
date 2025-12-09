import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import {
    getAgencies,
    getAgencyProperties,
    getAgencySummary,
    syncSummaries,
    getAllProperties,
    getAllClients,
    getAllAgents,
    getGlobalStats,
    getGlobalMonthlyClosureRatio,
    getGlobalTimeToClose,
    getGlobalMarketDemand,
    getFarmingRecommendations
} from '../controllers/superAdminController';

const router = express.Router();

// All routes require super admin authentication
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Existing routes
router.get('/agencies', getAgencies);
router.get('/agency/:id/properties', getAgencyProperties);
router.get('/agency/:id/summary', getAgencySummary);
router.post('/sync', syncSummaries);

// New aggregation routes (UNION queries across all databases)
router.get('/properties', getAllProperties);
router.get('/clients', getAllClients);
router.get('/agents', getAllAgents);
router.get('/stats', getGlobalStats);
router.get('/closure-ratio', getGlobalMonthlyClosureRatio);
router.get('/time-to-close', getGlobalTimeToClose);
router.get('/market-demand', getGlobalMarketDemand);
router.get('/farming-recommendations', getFarmingRecommendations);

export default router;
