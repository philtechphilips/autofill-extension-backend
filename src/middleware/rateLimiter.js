import rateLimit from "express-rate-limit";
import { error } from "../utils/response.js";

// Key generator that uses user ID if authenticated, otherwise IP
// We normalize IPv6 addresses to prevent bypass attacks
const keyGenerator = (req) => {
    if (req.user?.id) {
        return `user_${req.user.id}`;
    }
    // Get IP and normalize IPv6 to /64 prefix to prevent bypass
    let ip = req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
    // Normalize IPv6 addresses - extract /64 prefix
    if (ip.includes(":")) {
        const parts = ip.split(":");
        // Take first 4 segments (64 bits) for IPv6
        ip = parts.slice(0, 4).join(":") + "::";
    }
    return ip;
};

// Auth endpoints (login, forgot-password, etc.) - strict limits
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 min
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

// Registration - very strict to prevent spam accounts
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
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

// AI endpoints (form analyze, enhance, CV parse) - expensive operations
// Strict per-minute and per-hour limits
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 AI requests per minute
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: {
        success: false,
        error: "Too many AI requests. Please wait a moment.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many AI requests. Please wait a moment.", 429);
    },
});

// AI hourly limit - prevent abuse over time
export const aiHourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // 500 AI requests per hour
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: {
        success: false,
        error: "Hourly AI request limit reached. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Hourly AI request limit reached. Please try again later.", 429);
    },
});

// CV parsing - extra strict (large payloads, expensive)
export const cvParseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 CV parses per minute
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: {
        success: false,
        error: "Too many CV parsing requests. Please wait.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many CV parsing requests. Please wait.", 429);
    },
});

// Payment/checkout endpoints - prevent abuse
export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 payment-related requests per minute
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: {
        success: false,
        error: "Too many payment requests. Please slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many payment requests. Please slow down.", 429);
    },
});

// Webhook endpoints - allow higher limits for payment providers
export const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 webhooks per minute (payment providers may send bursts)
    message: {
        success: false,
        error: "Too many webhook requests.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many webhook requests.", 429);
    },
});

// General API limiter - for non-sensitive endpoints
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: { success: false, error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many requests. Please slow down.", 429);
    },
});

// Strict API limiter - for sensitive read operations
export const strictApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    keyGenerator,
    validate: { xForwardedForHeader: false, default: false },
    message: { success: false, error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Too many requests. Please slow down.", 429);
    },
});

// Global rate limiter - absolute maximum for any IP
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 total requests per minute per IP
    message: { success: false, error: "Rate limit exceeded. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        error(res, "Rate limit exceeded. Please slow down.", 429);
    },
});

export default {
    authLimiter,
    registerLimiter,
    aiLimiter,
    aiHourlyLimiter,
    cvParseLimiter,
    paymentLimiter,
    webhookLimiter,
    apiLimiter,
    strictApiLimiter,
    globalLimiter,
};
