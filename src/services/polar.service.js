import { Polar } from "@polar-sh/sdk";
import crypto from "crypto";
import config from "../config/index.js";
import { settingsRepository } from "../models/settings.model.js";

class PolarService {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    initialize() {
        if (!config.polar.accessToken) {
            console.warn("[Polar] Access token not configured. Payment features disabled.");
            return false;
        }

        this.client = new Polar({
            accessToken: config.polar.accessToken,
            server: config.polar.server,
        });
        this.initialized = true;
        return true;
    }

    isConfigured() {
        return this.initialized && this.client !== null;
    }

    async createProduct(pack) {
        if (!this.isConfigured()) {
            throw new Error("Polar is not configured");
        }

        const priceInCents = Math.round(pack.priceUSD * 100);

        const productData = {
            name: pack.name,
            description: `${pack.tokens} credits for Autofill.AI`,
            metadata: {
                packId: pack.packId,
                tokens: pack.tokens,
                priceNGN: pack.priceNGN,
            },
        };

        if (priceInCents === 0) {
            productData.prices = [{ amountType: "free" }];
        } else {
            productData.prices = [
                {
                    amountType: "fixed",
                    priceAmount: priceInCents,
                    priceCurrency: "usd",
                },
            ];
        }

        const product = await this.client.products.create(productData);
        return product;
    }

    async updateProduct(polarProductId, pack) {
        if (!this.isConfigured()) {
            throw new Error("Polar is not configured");
        }

        const priceInCents = Math.round(pack.priceUSD * 100);

        const updateData = {
            name: pack.name,
            description: `${pack.tokens} credits for Autofill.AI`,
            metadata: {
                packId: pack.packId,
                tokens: pack.tokens,
                priceNGN: pack.priceNGN,
            },
            isArchived: !pack.isActive,
        };

        if (priceInCents === 0) {
            updateData.prices = [{ amountType: "free" }];
        } else {
            updateData.prices = [
                {
                    amountType: "fixed",
                    priceAmount: priceInCents,
                    priceCurrency: "usd",
                },
            ];
        }

        const product = await this.client.products.update({
            id: polarProductId,
            productUpdate: updateData,
        });
        return product;
    }

    async syncPackToPolar(packId) {
        if (!this.isConfigured()) {
            return { success: false, error: "Polar is not configured" };
        }

        const pack = await settingsRepository.getPack(packId);
        if (!pack) {
            return { success: false, error: "Pack not found" };
        }

        try {
            let product;
            if (pack.polarProductId) {
                product = await this.updateProduct(pack.polarProductId, pack);
            } else {
                product = await this.createProduct(pack);
                await settingsRepository.updatePack(packId, {
                    polarProductId: product.id,
                });
            }
            return { success: true, product };
        } catch (err) {
            console.error(`[Polar] Failed to sync pack ${packId}:`, err.message);
            return { success: false, error: err.message };
        }
    }

    async syncAllPacksToPolar() {
        const results = {};
        const packIds = ["welcome", "pro", "elite"];

        for (const packId of packIds) {
            results[packId] = await this.syncPackToPolar(packId);
        }

        return results;
    }

    async createCheckout(packId, userId, userEmail) {
        if (!this.isConfigured()) {
            throw new Error("Polar is not configured");
        }

        const pack = await settingsRepository.getPack(packId);
        if (!pack) {
            throw new Error("Pack not found");
        }

        if (!pack.polarProductId) {
            const syncResult = await this.syncPackToPolar(packId);
            if (!syncResult.success) {
                throw new Error(`Failed to sync pack to Polar: ${syncResult.error}`);
            }
        }

        const updatedPack = await settingsRepository.getPack(packId);

        const checkout = await this.client.checkouts.create({
            productId: updatedPack.polarProductId,
            successUrl: `${config.polar.successUrl}&packId=${packId}`,
            customerEmail: userEmail,
            metadata: {
                userId: userId,
                packId: packId,
            },
        });

        return checkout;
    }

    async getCheckout(checkoutId) {
        if (!this.isConfigured()) {
            throw new Error("Polar is not configured");
        }

        return this.client.checkouts.get({ id: checkoutId });
    }

    async getOrder(orderId) {
        if (!this.isConfigured()) {
            throw new Error("Polar is not configured");
        }

        return this.client.orders.get({ id: orderId });
    }

    verifyWebhookSignature(payload, signature) {
        if (!config.polar.webhookSecret) {
            console.warn("[Polar] Webhook secret not configured");
            return false;
        }

        const expectedSignature = crypto
            .createHmac("sha256", config.polar.webhookSecret)
            .update(payload)
            .digest("hex");

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
}

export const polarService = new PolarService();
export default polarService;
