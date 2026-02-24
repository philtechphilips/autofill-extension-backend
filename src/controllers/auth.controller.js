import authService from "../services/auth.service.js";
import { success, created, error, unauthorized } from "../utils/response.js";
import config from "../config/index.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const setRefreshTokenCookie = (res, token) => {
    const isProduction = config.env === "production";
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/v1/auth",
    });
};

const clearRefreshTokenCookie = (res) => {
    const isProduction = config.env === "production";
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        path: "/api/v1/auth",
    });
};

export const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        const result = await authService.register({ email, password, name });

        if (result.error) {
            return error(res, result.error, result.status);
        }

        setRefreshTokenCookie(res, result.refreshToken);

        created(res, {
            user: result.user,
            accessToken: result.accessToken,
            encryptionKey: result.encryptionKey,
            message: result.message,
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const result = await authService.login({ email, password });

        if (result.error) {
            return error(res, result.error, result.status);
        }

        setRefreshTokenCookie(res, result.refreshToken);

        success(res, {
            user: result.user,
            accessToken: result.accessToken,
            encryptionKey: result.encryptionKey,
        });
    } catch (err) {
        next(err);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;

        const result = await authService.verifyEmail(token);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, {
            user: result.user,
            message: result.message,
        });
    } catch (err) {
        next(err);
    }
};

export const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        const result = await authService.resendVerificationEmail(email);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { message: result.message });
    } catch (err) {
        next(err);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const result = await authService.forgotPassword(email);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { message: result.message });
    } catch (err) {
        next(err);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        const result = await authService.resetPassword(token, password);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        success(res, { message: result.message });
    } catch (err) {
        next(err);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const { currentPassword, newPassword } = req.body;

        const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

        if (result.error) {
            return error(res, result.error, result.status);
        }

        clearRefreshTokenCookie(res);

        success(res, { message: result.message });
    } catch (err) {
        next(err);
    }
};

export const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

        const result = await authService.refreshAccessToken(refreshToken);

        if (result.error) {
            clearRefreshTokenCookie(res);
            return error(res, result.error, result.status);
        }

        setRefreshTokenCookie(res, result.refreshToken);

        success(res, {
            user: result.user,
            accessToken: result.accessToken,
        });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

        if (req.user) {
            await authService.logout(req.user.id, refreshToken);
        }

        clearRefreshTokenCookie(res);

        success(res, { message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};

export const logoutAll = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        await authService.logoutAll(req.user.id);
        clearRefreshTokenCookie(res);

        success(res, { message: "Logged out from all devices" });
    } catch (err) {
        next(err);
    }
};

export const me = async (req, res, next) => {
    try {
        if (!req.user) {
            return unauthorized(res, "Authentication required");
        }

        const user = await authService.getUser(req.user.id);

        if (!user) {
            return unauthorized(res, "User not found");
        }

        success(res, { user });
    } catch (err) {
        next(err);
    }
};

export default {
    register,
    login,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    refresh,
    logout,
    logoutAll,
    me,
};
