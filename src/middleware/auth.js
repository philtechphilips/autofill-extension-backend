import { unauthorized } from "../utils/response.js";

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized(res, "Missing or invalid authorization header");
    }

    const token = authHeader.split(" ")[1];

    try {
        // TODO: Implement JWT verification when auth service is added
        // const decoded = jwt.verify(token, config.jwt.secret);
        // req.user = decoded;
        
        // For now, pass through (remove this when implementing real auth)
        req.user = { id: "placeholder" };
        next();
    } catch (err) {
        return unauthorized(res, "Invalid or expired token");
    }
};

export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        // TODO: Implement JWT verification when auth service is added
        // const decoded = jwt.verify(token, config.jwt.secret);
        // req.user = decoded;
        req.user = { id: "placeholder" };
    } catch (err) {
        // Ignore invalid tokens for optional auth
    }

    next();
};
