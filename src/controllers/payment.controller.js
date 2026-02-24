import { polarService } from "../services/polar.service.js";
import { settingsRepository } from "../models/settings.model.js";
import { userRepository } from "../models/user.model.js";
import { transactionRepository } from "../models/transaction.model.js";
import { success, error } from "../utils/response.js";

export const createCheckout = async (req, res) => {
    try {
        const { packId } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!packId) {
            return error(res, "packId is required", 400);
        }

        const validPackIds = ["welcome", "pro", "elite"];
        if (!validPackIds.includes(packId)) {
            return error(res, `Invalid packId. Must be one of: ${validPackIds.join(", ")}`, 400);
        }

        const pack = await settingsRepository.getPack(packId);
        if (!pack || !pack.isActive) {
            return error(res, "Pack not available", 400);
        }

        if (!polarService.isConfigured()) {
            return error(res, "Payment system is not configured", 503);
        }

        const checkout = await polarService.createCheckout(packId, userId, userEmail);

        return success(res, {
            checkoutUrl: checkout.url,
            checkoutId: checkout.id,
        });
    } catch (err) {
        console.error("[Payment] Checkout error:", err.message);
        return error(res, "Failed to create checkout session");
    }
};

export const getCredits = async (req, res) => {
    try {
        const userId = req.user.id;
        const credits = await userRepository.getCredits(userId);
        const stats = await transactionRepository.getUserStats(userId);

        return success(res, {
            credits,
            stats,
        });
    } catch (err) {
        return error(res, "Failed to get credit balance");
    }
};

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, skip = 0, type } = req.query;

        const transactions = await transactionRepository.getUserTransactions(userId, {
            limit: parseInt(limit, 10),
            skip: parseInt(skip, 10),
            type,
        });

        return success(res, transactions);
    } catch (err) {
        return error(res, "Failed to get transactions");
    }
};

export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["webhook-signature"] || req.headers["x-polar-signature"];
        const payload = JSON.stringify(req.body);

        if (signature && !polarService.verifyWebhookSignature(payload, signature)) {
            console.warn("[Webhook] Invalid signature");
            return error(res, "Invalid signature", 401);
        }

        const event = req.body;
        const eventType = event.type || event.event;

        console.log(`[Webhook] Received event: ${eventType}`);

        switch (eventType) {
            case "order.paid":
                await handleOrderPaid(event.data);
                break;
            case "order.refunded":
                await handleOrderRefunded(event.data);
                break;
            case "checkout.created":
            case "checkout.updated":
                console.log(`[Webhook] Checkout event: ${eventType}`);
                break;
            default:
                console.log(`[Webhook] Unhandled event type: ${eventType}`);
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error("[Webhook] Error:", err.message);
        return res.status(200).json({ received: true, error: err.message });
    }
};

async function handleOrderPaid(orderData) {
    const orderId = orderData.id;
    const metadata = orderData.metadata || {};
    const productId = orderData.product_id || orderData.productId;

    const existingTransaction = await transactionRepository.findByPolarOrderId(orderId);
    if (existingTransaction) {
        console.log(`[Webhook] Order ${orderId} already processed`);
        return;
    }

    let userId = metadata.userId;
    let pack = null;

    if (metadata.packId) {
        pack = await settingsRepository.getPack(metadata.packId);
    }

    if (!pack && productId) {
        pack = await settingsRepository.getPackByPolarProductId(productId);
    }

    if (!pack) {
        console.error(`[Webhook] Could not find pack for order ${orderId}`);
        return;
    }

    if (!userId) {
        const customerEmail = orderData.customer?.email || orderData.customerEmail;
        if (customerEmail) {
            const user = await userRepository.findByEmail(customerEmail);
            if (user) {
                userId = user._id.toString();
            }
        }
    }

    if (!userId) {
        console.error(`[Webhook] Could not find user for order ${orderId}`);
        return;
    }

    const user = await userRepository.addCredits(userId, pack.tokens);
    if (!user) {
        console.error(`[Webhook] Failed to add credits for user ${userId}`);
        return;
    }

    await transactionRepository.createPurchase(userId, pack.tokens, user.credits, pack, {
        orderId,
        checkoutId: orderData.checkout_id || orderData.checkoutId,
    });

    console.log(`[Webhook] Added ${pack.tokens} credits to user ${userId} for order ${orderId}`);
}

async function handleOrderRefunded(orderData) {
    const orderId = orderData.id;

    const transaction = await transactionRepository.findByPolarOrderId(orderId);
    if (!transaction) {
        console.log(`[Webhook] No transaction found for refunded order ${orderId}`);
        return;
    }

    const userId = transaction.userId;
    const refundAmount = transaction.amount;

    const user = await userRepository.findById(userId);
    if (!user) {
        console.error(`[Webhook] User not found for refund: ${userId}`);
        return;
    }

    const newBalance = Math.max(0, user.credits - refundAmount);
    await userRepository.findByIdAndUpdate(userId, { credits: newBalance });

    await transactionRepository.createRefund(
        userId,
        -refundAmount,
        newBalance,
        orderId,
        "Order refunded via Polar"
    );

    console.log(`[Webhook] Processed refund for order ${orderId}, user ${userId}`);
}
