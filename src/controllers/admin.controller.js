import { UserModel } from "../models/user.model.js";
import { ProfileModel } from "../models/profile.model.js";
import { UserStatsModel } from "../models/usage.model.js";
import { settingsRepository } from "../models/settings.model.js";
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
        return success(res, settings, "Token costs updated successfully");
    } catch (err) {
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

        return success(res, { settings, polarSync }, "Pack updated successfully");
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
        return success(res, results, "Packs synced to Polar");
    } catch (err) {
        return error(res, "Failed to sync packs to Polar");
    }
};
