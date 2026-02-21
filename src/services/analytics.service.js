import { usageEventRepository, userStatsRepository } from "../models/usage.model.js";

const TIME_SAVED_SECONDS = {
    form_fill: 30,
    cv_parse: 300,
    text_enhance: 120,
};

export const recordEvent = async (userId, eventData) => {
    const { type, domain, pageTitle, fieldCount, success, profileId, fillMode, metadata } =
        eventData;

    if (!type || !["form_fill", "cv_parse", "text_enhance"].includes(type)) {
        return { error: "Invalid event type", status: 400 };
    }

    const event = await usageEventRepository.create({
        userId,
        type,
        domain: domain || null,
        pageTitle: pageTitle ? pageTitle.substring(0, 200) : null,
        fieldCount: fieldCount || 0,
        success: success !== false,
        profileId: profileId || null,
        fillMode: fillMode || null,
        metadata: metadata || {},
    });

    const statsUpdate = {
        estimatedTimeSavedSeconds: TIME_SAVED_SECONDS[type] || 0,
    };

    if (type === "form_fill") {
        statsUpdate.totalFills = 1;
        statsUpdate.totalFieldsFilled = fieldCount || 0;
        if (success !== false) {
            statsUpdate.totalSuccessfulFills = 1;
        }
    } else if (type === "cv_parse") {
        statsUpdate.totalCVParses = 1;
    } else if (type === "text_enhance") {
        statsUpdate.totalEnhancements = 1;
    }

    await userStatsRepository.incrementStats(userId, statsUpdate);

    return { event };
};

export const getStats = async (userId) => {
    const stats = await userStatsRepository.getOrCreate(userId);

    const successRate =
        stats.totalFills > 0
            ? Math.round((stats.totalSuccessfulFills / stats.totalFills) * 1000) / 10
            : 100;

    const timeSavedHours = Math.round((stats.estimatedTimeSavedSeconds / 3600) * 10) / 10;

    return {
        stats: {
            totalFills: stats.totalFills,
            totalFieldsFilled: stats.totalFieldsFilled,
            totalSuccessfulFills: stats.totalSuccessfulFills,
            totalCVParses: stats.totalCVParses,
            totalEnhancements: stats.totalEnhancements,
            estimatedTimeSavedSeconds: stats.estimatedTimeSavedSeconds,
            timeSavedHours,
            successRate,
            lastActivityAt: stats.lastActivityAt,
        },
    };
};

export const getEvents = async (userId, options = {}) => {
    const { page = 1, limit = 20, type } = options;

    const result = await usageEventRepository.findByUserId(userId, {
        page: parseInt(page, 10),
        limit: Math.min(parseInt(limit, 10), 100),
        type,
    });

    return result;
};

export const getRecentEvents = async (userId, limit = 6) => {
    const events = await usageEventRepository.getRecentEvents(userId, limit);
    return { events };
};

export const getDailyStats = async (userId, days = 30) => {
    const dailyData = await usageEventRepository.getDailyStats(userId, days);

    const today = new Date();
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayData = dailyData.find((d) => d._id === dateStr);
        result.push({
            date: dateStr,
            count: dayData ? dayData.count : 0,
            fieldsFilled: dayData ? dayData.fieldsFilled : 0,
        });
    }

    return { daily: result };
};

export default {
    recordEvent,
    getStats,
    getEvents,
    getRecentEvents,
    getDailyStats,
};
