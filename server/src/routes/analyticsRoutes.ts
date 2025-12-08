import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getClosureRatio,
    getTimeToCloseByLocation,
    getTimeToCloseByBudget,
    getTimeToCloseByAge,
    getHotPreferences,
    getFarmingRecommendations,
    getPropertyTypeDistribution,
    getPropertyStatusDistribution
} from '../controllers/analyticsController';

const router = express.Router();

router.use(authenticateToken);

router.get('/closure-ratio', getClosureRatio);
router.get('/time-to-close/location', getTimeToCloseByLocation);
router.get('/time-to-close/budget', getTimeToCloseByBudget);
router.get('/time-to-close/age', getTimeToCloseByAge);
router.get('/hot-preferences', getHotPreferences);
router.get('/farming-recommendations', getFarmingRecommendations);
router.get('/property-type-distribution', getPropertyTypeDistribution);
router.get('/property-status-distribution', getPropertyStatusDistribution);

export default router;
