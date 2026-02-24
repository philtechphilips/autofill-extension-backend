import { Router } from "express";
import {
    createCheckout,
    getCredits,
    getTransactions,
    handleWebhook,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { paymentLimiter, webhookLimiter, apiLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/checkout", authenticate, paymentLimiter, createCheckout);

router.get("/credits", authenticate, apiLimiter, getCredits);

router.get("/transactions", authenticate, apiLimiter, getTransactions);

router.post("/webhooks/polar", webhookLimiter, handleWebhook);

export default router;
