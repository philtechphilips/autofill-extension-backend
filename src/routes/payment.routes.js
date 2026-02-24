import { Router } from "express";
import {
    createCheckout,
    getCredits,
    getTransactions,
    handleWebhook,
} from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/checkout", authenticate, createCheckout);

router.get("/credits", authenticate, getCredits);

router.get("/transactions", authenticate, getTransactions);

router.post("/webhooks/polar", handleWebhook);

export default router;
