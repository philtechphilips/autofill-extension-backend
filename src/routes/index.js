import { Router } from "express";
import healthRoutes from "./health.routes.js";
import formRoutes from "./form.routes.js";
import authRoutes from "./auth.routes.js";
import profileRoutes from "./profile.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/form", formRoutes);
router.use("/auth", authRoutes);
router.use("/profiles", profileRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
