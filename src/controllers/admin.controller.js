import mongoose from "mongoose";
import { UserModel } from "../models/user.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { UserStatsModel } from "../models/usage.model.js";
import { settingsRepository } from "../models/settings.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { polarService } from "../services/polar.service.js";
import { success, error } from "../utils/response.js";

export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalProfiles = await ProfileModel.countDocuments();

        // aggregate stats from UserStatsModel
        const stats = await UserStatsModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalFills: { $sum: "$totalFills" },
                    totalFieldsFilled: { $sum: "$totalFieldsFilled" },
                    totalCVParses: { $sum: "$totalCVParses" },
                    estimatedTimeSavedSeconds: { $sum: "$estimatedTimeSavedSeconds" },
                },
            },
        ]);

        const totalUsageData =
            stats.length > 0
                ? stats[0]
                : {
                      totalFills: 0,
                      totalFieldsFilled: 0,
                      totalCVParses: 0,
                      estimatedTimeSavedSeconds: 0,
                  };

        const recentUsers = await UserModel.find()
            .select("-password -refreshTokens")
            .sort({ createdAt: -1 })
            .limit(5);

        return success(res, {
            totalUsers,
            totalProfiles,
            totalUsageData,
            recentUsers,
        });
    } catch (err) {
        return error(res, "Failed to get dashboard stats");
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find()
            .select("-password -refreshTokens")
            .sort({ createdAt: -1 });
        return success(res, users);
    } catch (err) {
        return error(res, "Failed to get users");
    }
};

export const getSettings = async (req, res) => {
    try {
        const settings = await settingsRepository.getSettings();
        return success(res, settings);
    } catch (err) {
        return error(res, "Failed to get settings");
    }
};

export const updateTokenCosts = async (req, res) => {
    try {
        const { formAnalysis, textEnhancement, cvParsing, profileUsage } = req.body;

        const tokenCosts = {};
        if (formAnalysis !== undefined) {
            if (typeof formAnalysis !== "number" || formAnalysis < 0) {
                return error(res, "formAnalysis must be a non-negative number", 400);
            }
            tokenCosts.formAnalysis = formAnalysis;
        }
        if (textEnhancement !== undefined) {
            if (typeof textEnhancement !== "number" || textEnhancement < 0) {
                return error(res, "textEnhancement must be a non-negative number", 400);
            }
            tokenCosts.textEnhancement = textEnhancement;
        }
        if (cvParsing !== undefined) {
            if (typeof cvParsing !== "number" || cvParsing < 0) {
                return error(res, "cvParsing must be a non-negative number", 400);
            }
            tokenCosts.cvParsing = cvParsing;
        }
        if (profileUsage !== undefined) {
            if (typeof profileUsage !== "number" || profileUsage < 0) {
                return error(res, "profileUsage must be a non-negative number", 400);
            }
            tokenCosts.profileUsage = profileUsage;
        }

        if (Object.keys(tokenCosts).length === 0) {
            return error(res, "At least one token cost field is required", 400);
        }

        const settings = await settingsRepository.updateTokenCosts(tokenCosts);
        return success(res, settings);
    } catch (err) {
        console.error("[Admin] Failed to update token costs:", err);
        return error(res, "Failed to update token costs");
    }
};

export const updatePack = async (req, res) => {
    try {
        const { packId } = req.params;
        const { name, tokens, priceNGN, priceUSD, isActive } = req.body;

        const validPackIds = ["welcome", "pro", "elite"];
        if (!validPackIds.includes(packId)) {
            return error(res, `Invalid packId. Must be one of: ${validPackIds.join(", ")}`, 400);
        }

        const packData = {};
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length === 0) {
                return error(res, "name must be a non-empty string", 400);
            }
            packData.name = name.trim();
        }
        if (tokens !== undefined) {
            if (typeof tokens !== "number" || tokens < 0) {
                return error(res, "tokens must be a non-negative number", 400);
            }
            packData.tokens = tokens;
        }
        if (priceNGN !== undefined) {
            if (typeof priceNGN !== "number" || priceNGN < 0) {
                return error(res, "priceNGN must be a non-negative number", 400);
            }
            packData.priceNGN = priceNGN;
        }
        if (priceUSD !== undefined) {
            if (typeof priceUSD !== "number" || priceUSD < 0) {
                return error(res, "priceUSD must be a non-negative number", 400);
            }
            packData.priceUSD = priceUSD;
        }
        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return error(res, "isActive must be a boolean", 400);
            }
            packData.isActive = isActive;
        }

        if (Object.keys(packData).length === 0) {
            return error(res, "At least one pack field is required", 400);
        }

        const settings = await settingsRepository.updatePack(packId, packData);
        if (!settings) {
            return error(res, "Pack not found", 404);
        }

        let polarSync = null;
        if (polarService.isConfigured()) {
            polarSync = await polarService.syncPackToPolar(packId);
        }

        return success(res, { settings, polarSync });
    } catch (err) {
        return error(res, "Failed to update pack");
    }
};

export const syncPacksToPolar = async (req, res) => {
    try {
        if (!polarService.isConfigured()) {
            return error(res, "Polar is not configured", 503);
        }

        const results = await polarService.syncAllPacksToPolar();
        return success(res, results);
    } catch (err) {
        return error(res, "Failed to sync packs to Polar");
    }
};

export const getPaymentAnalytics = async (req, res) => {
    try {
        const { period = "30d" } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate;
        switch (period) {
            case "7d":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "90d":
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case "all":
                startDate = new Date(0);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Overall stats
        const overallStats = await TransactionModel.aggregate([
            { $match: { type: "purchase" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$metadata.priceUSD" },
                    totalCredits: { $sum: "$amount" },
                    totalOrders: { $sum: 1 },
                },
            },
        ]);

        // Period stats
        const periodStats = await TransactionModel.aggregate([
            { $match: { type: "purchase", createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$metadata.priceUSD" },
                    credits: { $sum: "$amount" },
                    orders: { $sum: 1 },
                },
            },
        ]);

        // Revenue by pack
        const revenueByPack = await TransactionModel.aggregate([
            { $match: { type: "purchase", createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: "$metadata.packId",
                    packName: { $first: "$metadata.packName" },
                    revenue: { $sum: "$metadata.priceUSD" },
                    credits: { $sum: "$amount" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { revenue: -1 } },
        ]);

        // Daily revenue for chart (last 30 days max)
        const chartStartDate =
            period === "7d" ? startDate : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyRevenue = await TransactionModel.aggregate([
            { $match: { type: "purchase", createdAt: { $gte: chartStartDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    revenue: { $sum: "$metadata.priceUSD" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Recent transactions
        const recentTransactions = await TransactionModel.find({ type: "purchase" })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("userId", "name email");

        // Top customers
        const topCustomers = await TransactionModel.aggregate([
            { $match: { type: "purchase" } },
            {
                $group: {
                    _id: "$userId",
                    totalSpent: { $sum: "$metadata.priceUSD" },
                    totalCredits: { $sum: "$amount" },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 1,
                    totalSpent: 1,
                    totalCredits: 1,
                    orderCount: 1,
                    name: "$user.name",
                    email: "$user.email",
                },
            },
        ]);

        // Credit usage stats
        const usageStats = await TransactionModel.aggregate([
            { $match: { type: "usage", createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: "$metadata.operation",
                    totalUsed: { $sum: { $abs: "$amount" } },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Refund stats
        const refundStats = await TransactionModel.aggregate([
            { $match: { type: "refund" } },
            {
                $group: {
                    _id: null,
                    totalRefunded: { $sum: { $abs: "$amount" } },
                    refundCount: { $sum: 1 },
                },
            },
        ]);

        return success(res, {
            overview: {
                allTime: {
                    totalRevenue: overallStats[0]?.totalRevenue || 0,
                    totalCredits: overallStats[0]?.totalCredits || 0,
                    totalOrders: overallStats[0]?.totalOrders || 0,
                },
                period: {
                    label: period,
                    revenue: periodStats[0]?.revenue || 0,
                    credits: periodStats[0]?.credits || 0,
                    orders: periodStats[0]?.orders || 0,
                },
                refunds: {
                    totalRefunded: refundStats[0]?.totalRefunded || 0,
                    refundCount: refundStats[0]?.refundCount || 0,
                },
            },
            revenueByPack,
            dailyRevenue,
            usageByOperation: usageStats,
            topCustomers,
            recentTransactions: recentTransactions.map((t) => ({
                id: t._id,
                user: t.userId ? { name: t.userId.name, email: t.userId.email } : null,
                packName: t.metadata?.packName,
                amount: t.metadata?.priceUSD,
                credits: t.amount,
                date: t.createdAt,
            })),
        });
    } catch (err) {
        console.error("[Admin] Failed to get payment analytics:", err);
        return error(res, "Failed to get payment analytics");
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (type) query.type = type;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const [transactions, total] = await Promise.all([
            TransactionModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("userId", "name email"),
            TransactionModel.countDocuments(query),
        ]);

        return success(res, {
            transactions: transactions.map((t) => ({
                id: t._id,
                type: t.type,
                user: t.userId
                    ? { id: t.userId._id, name: t.userId.name, email: t.userId.email }
                    : null,
                amount: t.amount,
                balanceAfter: t.balanceAfter,
                description: t.description,
                metadata: t.metadata,
                createdAt: t.createdAt,
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error("[Admin] Failed to get transactions:", err);
        return error(res, "Failed to get transactions");
    }
};
