import { userRepository } from "../models/user.model.js";
import { transactionRepository } from "../models/transaction.model.js";
import { settingsRepository } from "../models/settings.model.js";

const OPERATION_TO_COST_KEY = {
    form_analyze: "formAnalysis",
    text_enhance: "textEnhancement",
    text_generate: "textGeneration",
    cv_parse: "cvParsing",
    profile_usage: "profileUsage",
};

// Cache token costs for 60 seconds to avoid repeated DB calls
let tokenCostsCache = null;
let tokenCostsCacheTime = 0;
const CACHE_TTL = 60 * 1000;

class CreditService {
    async getTokenCosts() {
        const now = Date.now();
        if (tokenCostsCache && now - tokenCostsCacheTime < CACHE_TTL) {
            return tokenCostsCache;
        }
        const settings = await settingsRepository.getSettings();
        tokenCostsCache = settings.tokenCosts;
        tokenCostsCacheTime = now;
        return tokenCostsCache;
    }

    async getTokenCost(operation) {
        const tokenCosts = await this.getTokenCosts();
        const costKey = OPERATION_TO_COST_KEY[operation] || operation;
        const cost = tokenCosts[costKey];
        return cost !== undefined ? cost : 1;
    }

    async checkCreditsAndGetCost(userId, operation) {
        const [tokenCosts, credits] = await Promise.all([
            this.getTokenCosts(),
            userRepository.getCredits(userId),
        ]);
        const costKey = OPERATION_TO_COST_KEY[operation] || operation;
        const cost = tokenCosts[costKey] !== undefined ? tokenCosts[costKey] : 1;
        // If cost is 0, always allow (free operation)
        return { hasEnough: cost === 0 || credits >= cost, cost, balance: credits };
    }

    async hasEnoughCredits(userId, operation) {
        const { hasEnough } = await this.checkCreditsAndGetCost(userId, operation);
        return hasEnough;
    }

    async deductCredits(userId, operation) {
        const tokenCosts = await this.getTokenCosts();
        const operationKey = OPERATION_TO_COST_KEY[operation] || operation;
        const cost = tokenCosts[operationKey] !== undefined ? tokenCosts[operationKey] : 1;

        if (cost === 0) {
            return { success: true, cost: 0, balance: await userRepository.getCredits(userId) };
        }

        const user = await userRepository.deductCredits(userId, cost);

        if (!user) {
            const currentCredits = await userRepository.getCredits(userId);
            return {
                success: false,
                error: "Insufficient credits",
                required: cost,
                available: currentCredits,
            };
        }

        // Fire-and-forget transaction logging (don't await)
        transactionRepository.createUsage(userId, cost, user.credits, operationKey).catch((err) => {
            console.error("[CreditService] Failed to log transaction:", err.message);
        });

        return {
            success: true,
            cost,
            balance: user.credits,
        };
    }

    invalidateCache() {
        tokenCostsCache = null;
        tokenCostsCacheTime = 0;
    }

    async getBalance(userId) {
        return userRepository.getCredits(userId);
    }

    async addCredits(userId, amount, reason = "Manual credit addition") {
        const user = await userRepository.addCredits(userId, amount);
        if (!user) {
            return { success: false, error: "User not found" };
        }

        // Fire-and-forget transaction logging
        transactionRepository.createBonus(userId, amount, user.credits, reason).catch((err) => {
            console.error("[CreditService] Failed to log bonus transaction:", err.message);
        });

        return {
            success: true,
            balance: user.credits,
        };
    }

    async getUsageSummary(userId) {
        const [credits, stats, tokenCosts] = await Promise.all([
            userRepository.getCredits(userId),
            transactionRepository.getUserStats(userId),
            settingsRepository.getTokenCosts(),
        ]);

        return {
            currentBalance: credits,
            tokenCosts,
            stats,
        };
    }
}

export const creditService = new CreditService();
export default creditService;
