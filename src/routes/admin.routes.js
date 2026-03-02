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
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
    updateTokenCostsSchema,
    updatePackSchema,
    getPaymentAnalyticsQuerySchema,
    getAllTransactionsQuerySchema,
} from "../validation/schemas.js";

const router = Router();

router.use(authenticateAdmin);

router.get("/dashboard-stats", getDashboardStats);
router.get("/users", getAllUsers);

router.get("/settings", getSettings);
router.put("/settings/token-costs", validateBody(updateTokenCostsSchema), updateTokenCosts);
router.put("/settings/packs/:packId", validateBody(updatePackSchema), updatePack);
router.post("/settings/sync-polar", syncPacksToPolar);

// Payment analytics
router.get(
    "/payments/analytics",
    validateQuery(getPaymentAnalyticsQuerySchema),
    getPaymentAnalytics
);
router.get(
    "/payments/transactions",
    validateQuery(getAllTransactionsQuerySchema),
    getAllTransactions
);

export default router;
