import authService from "../services/auth.service.js";
import { unauthorized, forbidden } from "../utils/response.js";

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized(res, "Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    try {
        const result = await authService.verifyAccessToken(token);

        if (result.error) {
            return unauthorized(res, result.error);
        }

        req.user = result.user;
        next();
    } catch (err) {
        return unauthorized(res, "Authentication failed");
    }
};

export const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized(res, "Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    try {
        const result = await authService.verifyAccessToken(token);

        if (result.error) {
            return unauthorized(res, result.error);
        }

        if (result.user.role !== "admin") {
            return forbidden(res, "Admin access required");
        }

        req.user = result.user;
        next();
    } catch (err) {
        return unauthorized(res, "Authentication failed");
    }
};

export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const result = await authService.verifyAccessToken(token);

        if (!result.error) {
            req.user = result.user;
        }
    } catch {
        // Ignore errors for optional auth
    }

    next();
};
