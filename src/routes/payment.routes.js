import { Router } from "express";
import {
    createCheckout,
    getCredits,
    getTransactions,
    handleWebhook,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { paymentLimiter, webhookLimiter, apiLimiter } from "../middleware/rateLimiter.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { checkoutSchema, getTransactionsQuerySchema } from "../validation/schemas.js";

const router = Router();

router.post(
    "/checkout",
    authenticate,
    paymentLimiter,
    validateBody(checkoutSchema),
    createCheckout
);

router.get("/credits", authenticate, apiLimiter, getCredits);

router.get(
    "/transactions",
    authenticate,
    apiLimiter,
    validateQuery(getTransactionsQuerySchema),
    getTransactions
);

router.post("/webhooks/polar", webhookLimiter, handleWebhook);

export default router;
