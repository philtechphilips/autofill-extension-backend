import { Router } from "express";
import healthRoutes from "./health.routes.js";
import formRoutes from "./form.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import adminRoutes from "./admin.routes.js";
import pricingRoutes from "./pricing.routes.js";
import paymentRoutes from "./payment.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/form", formRoutes);
router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);
router.use("/pricing", pricingRoutes);
router.use("/payment", paymentRoutes);

export default router;
