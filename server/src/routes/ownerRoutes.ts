import express from "express";
import { getOwnerPerformance } from "../controllers/ownerPerformanceController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();

router.get(
    "/performance",
    authenticateToken,          // verifies JWT
    requireRole(["owner"]),     // ensures only owners can access
    getOwnerPerformance
);


export default router;
