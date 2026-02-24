import { Router } from "express";
import {
    getDashboardStats,
    getAllUsers,
    getSettings,
    updateTokenCosts,
    updatePack,
    syncPacksToPolar,
    getPaymentAnalytics,
    getAllTransactions,
} from "../controllers/admin.controller.js";
import { authenticateAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/dashboard-stats", getDashboardStats);
router.get("/users", getAllUsers);

router.get("/settings", getSettings);
router.put("/settings/token-costs", updateTokenCosts);
router.put("/settings/packs/:packId", updatePack);
router.post("/settings/sync-polar", syncPacksToPolar);

// Payment analytics
router.get("/payments/analytics", getPaymentAnalytics);
router.get("/payments/transactions", getAllTransactions);

export default router;
