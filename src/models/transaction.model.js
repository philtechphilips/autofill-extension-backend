import mongoose from "mongoose";
import { BaseModel } from "./base.model.js";

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["purchase", "usage", "refund", "bonus"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        metadata: {
            packId: String,
            packName: String,
            polarOrderId: String,
            polarCheckoutId: String,
            operation: {
                type: String,
                enum: [
                    "formAnalysis",
                    "textEnhancement",
                    "textGeneration",
                    "cvParsing",
                    "profileUsage",
                ],
            },
            priceUSD: Number,
            priceNGN: Number,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ "metadata.polarOrderId": 1 });

const TransactionModel = mongoose.model("Transaction", transactionSchema);

class TransactionRepository extends BaseModel {
    constructor() {
        super(TransactionModel);
    }

    async createPurchase(userId, amount, balanceAfter, packData, polarData = {}) {
        return this.create({
            userId,
            type: "purchase",
            amount,
            balanceAfter,
            description: `Purchased ${packData.name} - ${amount} credits`,
            metadata: {
                packId: packData.packId,
                packName: packData.name,
                priceUSD: packData.priceUSD,
                priceNGN: packData.priceNGN,
                polarOrderId: polarData.orderId,
                polarCheckoutId: polarData.checkoutId,
            },
        });
    }

    async createUsage(userId, amount, balanceAfter, operation) {
        const operationNames = {
            formAnalysis: "Form Analysis",
            textEnhancement: "Text Enhancement",
            textGeneration: "Text Generation",
            cvParsing: "CV Parsing",
            profileUsage: "Profile Usage",
        };

        return this.create({
            userId,
            type: "usage",
            amount: -amount,
            balanceAfter,
            description: `Used ${amount} credit(s) for ${operationNames[operation] || operation}`,
            metadata: {
                operation,
            },
        });
    }

    async createRefund(userId, amount, balanceAfter, polarOrderId, reason = "") {
        return this.create({
            userId,
            type: "refund",
            amount,
            balanceAfter,
            description: `Refund: ${reason || "Order refunded"} - ${amount} credits`,
            metadata: {
                polarOrderId,
            },
        });
    }

    async createBonus(userId, amount, balanceAfter, reason) {
        return this.create({
            userId,
            type: "bonus",
            amount,
            balanceAfter,
            description: `Bonus: ${reason} - ${amount} credits`,
        });
    }

    async getUserTransactions(userId, options = {}) {
        const { limit = 20, skip = 0, type } = options;
        const query = { userId };
        if (type) query.type = type;

        return this.find(query, {
            sort: { createdAt: -1 },
            limit,
            skip,
        });
    }

    async findByPolarOrderId(polarOrderId) {
        return this.findOne({ "metadata.polarOrderId": polarOrderId });
    }

    async getUserStats(userId) {
        const stats = await this.model.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const result = {
            totalPurchased: 0,
            totalUsed: 0,
            totalRefunded: 0,
            totalBonus: 0,
            purchaseCount: 0,
            usageCount: 0,
        };

        stats.forEach((stat) => {
            if (stat._id === "purchase") {
                result.totalPurchased = stat.total;
                result.purchaseCount = stat.count;
            } else if (stat._id === "usage") {
                result.totalUsed = Math.abs(stat.total);
                result.usageCount = stat.count;
            } else if (stat._id === "refund") {
                result.totalRefunded = Math.abs(stat.total);
            } else if (stat._id === "bonus") {
                result.totalBonus = stat.total;
            }
        });

        return result;
    }

    async getUserStatsWithBalance(userId, currentBalance) {
        const stats = await this.getUserStats(userId);

        const totalCreditsIn = stats.totalPurchased + stats.totalBonus + stats.totalRefunded;
        const calculatedUsed = totalCreditsIn - currentBalance;

        if (calculatedUsed > 0 && calculatedUsed !== stats.totalUsed) {
            stats.totalUsed = calculatedUsed;
        }

        return stats;
    }

    async getLastPurchasedPack(userId) {
        const lastPurchase = await this.model
            .findOne({
                userId: new mongoose.Types.ObjectId(userId),
                type: "purchase",
            })
            .sort({ createdAt: -1 });

        if (!lastPurchase) return null;

        return {
            packId: lastPurchase.metadata?.packId,
            packName: lastPurchase.metadata?.packName,
            purchasedAt: lastPurchase.createdAt,
        };
    }
}

export const transactionRepository = new TransactionRepository();
export { TransactionModel };
export default transactionRepository;
