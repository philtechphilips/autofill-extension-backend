import config from "../config/index.js";
import crypto from "crypto";
import { settingsRepository } from "../models/settings.model.js";

class PaystackService {
    constructor() {
        this.secretKey = config.paystack.secretKey;
        this.baseUrl = "https://api.paystack.co";
    }

    isConfigured() {
        return !!this.secretKey;
    }

    async initializeTransaction(packId, userId, userEmail) {
        if (!this.isConfigured()) {
            throw new Error("Paystack is not configured");
        }

        const pack = await settingsRepository.getPack(packId);
        if (!pack) {
            throw new Error("Pack not found");
        }

        const amountInKobo = Math.round(pack.priceNGN * 100);

        const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: userEmail,
                amount: amountInKobo,
                callback_url: `${config.polar.successUrl}&packId=${packId}&method=paystack`,
                metadata: {
                    userId,
                    packId,
                    custom_fields: [
                        {
                            display_name: "Pack",
                            variable_name: "pack_id",
                            value: packId,
                        },
                        {
                            display_name: "Credits",
                            variable_name: "tokens",
                            value: pack.tokens.toString(),
                        },
                    ],
                },
            }),
        });

        const data = await response.json();
        if (!data.status) {
            throw new Error(data.message || "Failed to initialize Paystack transaction");
        }

        return data.data; // Includes authorization_url, access_code, reference
    }

    async verifyTransaction(reference) {
        const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
            },
        });

        const data = await response.json();
        return data;
    }

    verifyWebhookSignature(rawBody, signature) {
        if (!this.secretKey || !rawBody) return false;

        const hash = crypto.createHmac("sha512", this.secretKey).update(rawBody).digest("hex");

        return hash === signature;
    }
}

export const paystackService = new PaystackService();
export default paystackService;
