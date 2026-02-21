import rateLimit from "express-rate-limit";
import { error } from "../utils/response.js";

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: "Too many attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many attempts. Please try again in 15 minutes.", 429);
    },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        error: "Too many registration attempts. Please try again in an hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many registration attempts. Please try again in an hour.", 429);
    },
});

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { success: false, error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many requests. Please slow down.", 429);
    },
});

export default {
    authLimiter,
    registerLimiter,
    apiLimiter,
};
