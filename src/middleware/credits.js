import { creditService } from "../services/credit.service.js";
import { error } from "../utils/response.js";

export const requireCredits = (operation) => {
    return async (req, res, next) => {
        if (!req.user) {
            return error(res, "Authentication required", 401);
        }

        const hasCredits = await creditService.hasEnoughCredits(req.user.id, operation);

        if (!hasCredits) {
            const cost = await creditService.getTokenCost(operation);
            const balance = await creditService.getBalance(req.user.id);

            return error(res, "Insufficient credits", 402, {
                required: cost,
                available: balance,
                operation,
            });
        }

        req.creditOperation = operation;
        next();
    };
};

export const deductCreditsAfterSuccess = async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.creditOperation && req.user) {
            const result = await creditService.deductCredits(req.user.id, req.creditOperation);

            if (result.success && data && typeof data === "object") {
                data.creditsUsed = result.cost;
                data.creditsRemaining = result.balance;
            }
        }

        return originalJson(data);
    };

    next();
};

export const checkCredits = (operation) => {
    return [requireCredits(operation), deductCreditsAfterSuccess];
};
