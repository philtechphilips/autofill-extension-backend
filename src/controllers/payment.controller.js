import { polarService } from "../services/polar.service.js";
import { settingsRepository } from "../models/settings.model.js";
import { userRepository } from "../models/user.model.js";
import { transactionRepository } from "../models/transaction.model.js";
import { sendPaymentSuccessEmail } from "../services/email.service.js";
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
        console.log("[Webhook] ====== INCOMING WEBHOOK ======");

        const signature = req.headers["webhook-signature"];
        const webhookId = req.headers["webhook-id"];
        const timestamp = req.headers["webhook-timestamp"];
        const payload = JSON.stringify(req.body);

        console.log(`[Webhook] ID: ${webhookId}, Timestamp: ${timestamp}`);

        // Verify webhook signature - mandatory
        const isValid = polarService.verifyWebhookSignature(
            payload,
            signature,
            webhookId,
            timestamp
        );
        if (!isValid) {
            console.warn("[Webhook] Invalid signature - rejecting webhook");
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
    const productMetadata = orderData.product?.metadata || {};

    console.log(`[Webhook] Processing order.paid for order ${orderId}`);
    console.log(`[Webhook] Metadata:`, metadata);
    console.log(`[Webhook] Product metadata:`, productMetadata);

    const existingTransaction = await transactionRepository.findByPolarOrderId(orderId);
    if (existingTransaction) {
        console.log(`[Webhook] Order ${orderId} already processed`);
        return;
    }

    let userId = metadata.userId;
    let pack = null;
    let tokensToAdd = 0;

    // Try to get pack from our database
    if (metadata.packId) {
        pack = await settingsRepository.getPack(metadata.packId);
    }

    if (!pack && productId) {
        pack = await settingsRepository.getPackByPolarProductId(productId);
    }

    // Get tokens - prefer from product metadata (set when creating product on Polar)
    if (productMetadata.tokens) {
        tokensToAdd = Number(productMetadata.tokens);
    } else if (pack) {
        tokensToAdd = pack.tokens;
    }

    if (!tokensToAdd) {
        console.error(`[Webhook] Could not determine tokens for order ${orderId}`);
        return;
    }

    // Find user by ID or email
    if (!userId) {
        const customerEmail = orderData.customer?.email || orderData.customerEmail;
        console.log(`[Webhook] Looking up user by email: ${customerEmail}`);
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

    console.log(`[Webhook] Adding ${tokensToAdd} credits to user ${userId}`);

    const user = await userRepository.addCredits(userId, tokensToAdd);
    if (!user) {
        console.error(`[Webhook] Failed to add credits for user ${userId}`);
        return;
    }

    const packData = pack || {
        packId: metadata.packId || productMetadata.packId || "unknown",
        name: orderData.product?.name || "Credit Pack",
        priceUSD: orderData.total_amount / 100,
        priceNGN: productMetadata.priceNGN || 0,
    };

    await transactionRepository.createPurchase(userId, tokensToAdd, user.credits, packData, {
        orderId,
        checkoutId: orderData.checkout_id || orderData.checkoutId,
    });

    console.log(
        `[Webhook] SUCCESS: Added ${tokensToAdd} credits to user ${userId} for order ${orderId}. New balance: ${user.credits}`
    );

    // Send payment success email
    try {
        const customerEmail = user.email || orderData.customer?.email;
        if (customerEmail) {
            const amountPaid = (orderData.total_amount || orderData.amount || 0) / 100;
            await sendPaymentSuccessEmail(customerEmail, {
                name: user.name || user.firstName,
                packName: packData.name,
                credits: tokensToAdd,
                amount: amountPaid.toFixed(2),
                newBalance: user.credits,
            });
        }
    } catch (emailErr) {
        console.error(`[Webhook] Failed to send payment success email:`, emailErr.message);
    }
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
