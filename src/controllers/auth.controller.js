import authService from "../services/auth.service.js";
import { success, created, error, unauthorized } from "../utils/response.js";
import config from "../config/index.js";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const setRefreshTokenCookie = (res, token) => {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/api/v1/auth",
    });
};

const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "strict",
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
        });
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
    refresh,
    logout,
    logoutAll,
    me,
};
