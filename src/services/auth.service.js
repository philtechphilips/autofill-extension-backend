import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import config from "../config/index.js";
import userRepository from "../models/user.model.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 12;

const validateEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    return EMAIL_REGEX.test(email.trim().toLowerCase());
};

const validatePassword = (password) => {
    if (!password || typeof password !== "string") {
        return { valid: false, message: "Password is required" };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { valid: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
};

const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

const sanitizeUser = (user) => {
    if (!user) return null;
    if (typeof user.toJSON === "function") {
        return user.toJSON();
    }
    const { passwordHash, refreshTokens, _id, __v, ...safe } = user;
    return { id: _id?.toString(), ...safe };
};

const generateAccessToken = (user) => {
    const userId = user.id || user._id?.toString();
    return jwt.sign(
        {
            sub: userId,
            email: user.email,
            type: "access",
        },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiresIn }
    );
};

const generateRefreshToken = async (user) => {
    const userId = user.id || user._id?.toString();
    const tokenId = uuidv4();
    const expiresIn = config.jwt.refreshExpiresIn;
    
    const token = jwt.sign(
        {
            sub: userId,
            jti: tokenId,
            type: "refresh",
        },
        config.jwt.refreshSecret,
        { expiresIn }
    );

    const expiresAt = Date.now() + parseExpiry(expiresIn);
    
    await userRepository.addRefreshToken(userId, {
        id: tokenId,
        expiresAt,
        createdAt: Date.now(),
    });

    return token;
};

const parseExpiry = (expiry) => {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    switch (unit) {
        case "s": return value * 1000;
        case "m": return value * 60 * 1000;
        case "h": return value * 60 * 60 * 1000;
        case "d": return value * 24 * 60 * 60 * 1000;
        default: return 7 * 24 * 60 * 60 * 1000;
    }
};

export const register = async ({ email, password, name }) => {
    if (!validateEmail(email)) {
        return { error: "Invalid email format", status: 400 };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return { error: passwordValidation.message, status: 400 };
    }

    try {
        const passwordHash = await hashPassword(password);
        
        const user = await userRepository.create({
            email: email.trim().toLowerCase(),
            name: name?.trim() || null,
            passwordHash,
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    } catch (err) {
        if (err.code === 11000) {
            return { error: "Email already registered", status: 409 };
        }
        throw err;
    }
};

export const login = async ({ email, password }) => {
    if (!email || !password) {
        return { error: "Email and password are required", status: 400 };
    }

    const user = await userRepository.findByEmail(email);
    
    if (!user) {
        return { error: "Invalid email or password", status: 401 };
    }

    const isValid = await comparePassword(password, user.passwordHash);
    
    if (!isValid) {
        return { error: "Invalid email or password", status: 401 };
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    };
};

export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        return { error: "Refresh token is required", status: 400 };
    }

    try {
        const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
        
        if (decoded.type !== "refresh") {
            return { error: "Invalid token type", status: 401 };
        }

        const user = await userRepository.findById(decoded.sub);
        
        if (!user) {
            return { error: "User not found", status: 401 };
        }

        const storedToken = await userRepository.findRefreshToken(user._id || user.id, decoded.jti);
        
        if (!storedToken) {
            return { error: "Token has been revoked", status: 401 };
        }

        await userRepository.removeRefreshToken(user._id || user.id, decoded.jti);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = await generateRefreshToken(user);

        return {
            user: sanitizeUser(user),
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return { error: "Refresh token has expired", status: 401 };
        }
        return { error: "Invalid refresh token", status: 401 };
    }
};

export const logout = async (userId, refreshToken) => {
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
            await userRepository.removeRefreshToken(userId, decoded.jti);
        } catch {
            // Token invalid, nothing to revoke
        }
    }
    return { success: true };
};

export const logoutAll = async (userId) => {
    await userRepository.removeAllRefreshTokens(userId);
    return { success: true };
};

export const verifyAccessToken = async (token) => {
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        
        if (decoded.type !== "access") {
            return { error: "Invalid token type" };
        }

        const user = await userRepository.findById(decoded.sub);
        
        if (!user) {
            return { error: "User not found" };
        }

        return { user: sanitizeUser(user) };
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return { error: "Token has expired" };
        }
        return { error: "Invalid token" };
    }
};

export const getUser = async (userId) => {
    const user = await userRepository.findById(userId);
    return user ? sanitizeUser(user) : null;
};

export default {
    register,
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    verifyAccessToken,
    getUser,
};
