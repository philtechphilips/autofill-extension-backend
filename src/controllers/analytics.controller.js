import analyticsService from "../services/analytics.service.js";
import { success, created, error, unauthorized, badRequest } from "../utils/response.js";

export const recordEvent = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const {
            type,
            domain,
            pageTitle,
            fieldCount,
            success: eventSuccess,
            profileId,
            fillMode,
            metadata,
        } = req.body;

        if (!type) {
            return badRequest(res, "Event type is required");
        }

        const result = await analyticsService.recordEvent(req.user.id, {
            type,
            domain,
            pageTitle,
            fieldCount,
            success: eventSuccess,
            profileId,
            fillMode,
            metadata,
        });

        if (result.error) {
            return error(res, result.error, result.status);
        }

        created(res, { event: result.event });
    } catch (err) {
        next(err);
    }
};

export const getStats = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const result = await analyticsService.getStats(req.user.id);
        success(res, result);
    } catch (err) {
        next(err);
    }
};

export const getEvents = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { page, limit, type } = req.query;
        const result = await analyticsService.getEvents(req.user.id, { page, limit, type });
        success(res, result);
    } catch (err) {
        next(err);
    }
};

export const getRecentEvents = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const limit = parseInt(req.query.limit, 10) || 6;
        const result = await analyticsService.getRecentEvents(req.user.id, Math.min(limit, 20));
        success(res, result);
    } catch (err) {
        next(err);
    }
};

export const getDailyStats = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const days = parseInt(req.query.days, 10) || 30;
        const result = await analyticsService.getDailyStats(req.user.id, Math.min(days, 90));
        success(res, result);
    } catch (err) {
        next(err);
    }
};

export default {
    recordEvent,
    getStats,
    getEvents,
    getRecentEvents,
    getDailyStats,
};
