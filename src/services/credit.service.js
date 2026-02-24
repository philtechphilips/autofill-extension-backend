import { userRepository } from "../models/user.model.js";
import { transactionRepository } from "../models/transaction.model.js";
import { settingsRepository } from "../models/settings.model.js";

const OPERATION_TO_COST_KEY = {
    form_analyze: "formAnalysis",
    text_enhance: "textEnhancement",
    cv_parse: "cvParsing",
    profile_usage: "profileUsage",
};

class CreditService {
    async getTokenCost(operation) {
        const settings = await settingsRepository.getSettings();
        const costKey = OPERATION_TO_COST_KEY[operation] || operation;
        return settings.tokenCosts[costKey] || 1;
    }

    async hasEnoughCredits(userId, operation) {
        const cost = await this.getTokenCost(operation);
        const credits = await userRepository.getCredits(userId);
        return credits >= cost;
    }

    async deductCredits(userId, operation) {
        const cost = await this.getTokenCost(operation);

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

        await transactionRepository.createUsage(userId, cost, user.credits, operation);

        return {
            success: true,
            cost,
            balance: user.credits,
        };
    }

    async getBalance(userId) {
        return userRepository.getCredits(userId);
    }

    async addCredits(userId, amount, reason = "Manual credit addition") {
        const user = await userRepository.addCredits(userId, amount);
        if (!user) {
            return { success: false, error: "User not found" };
        }

        await transactionRepository.createBonus(userId, amount, user.credits, reason);

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
