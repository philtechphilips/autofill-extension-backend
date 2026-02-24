import { creditService } from "../services/credit.service.js";
import { error } from "../utils/response.js";

export const requireCredits = (operation) => {
    return async (req, res, next) => {
        if (!req.user) {
            return error(res, "Authentication required", 401);
        }

        // Single call to check credits and get cost/balance
        const { hasEnough, cost, balance } = await creditService.checkCreditsAndGetCost(
            req.user.id,
            operation
        );

        if (!hasEnough) {
            return error(res, "Insufficient credits", 402, {
                required: cost,
                available: balance,
                operation,
            });
        }

        req.creditOperation = operation;
        req.creditCost = cost;
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
