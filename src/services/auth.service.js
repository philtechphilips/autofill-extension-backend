import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import config from "../config/index.js";
import userRepository from "../models/user.model.js";
import { settingsRepository } from "../models/settings.model.js";
import { transactionRepository } from "../models/transaction.model.js";
import emailService from "./email.service.js";

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
        return {
            valid: false,
            message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one uppercase letter",
        };
    }
    if (!/[a-z]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one lowercase letter",
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            valid: false,
            message: "Password must contain at least one number",
        };
    }
    return { valid: true };
};

const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const generateEncryptionKey = () => crypto.randomBytes(32).toString("base64");

const sanitizeUser = (user) => {
    if (!user) return null;
    if (typeof user.toJSON === "function") {
        return user.toJSON();
    }
    const {
        password,
        refreshTokens,
        _id,
        __v,
        emailVerificationToken,
        emailVerificationExpires,
        passwordResetToken,
        passwordResetExpires,
        ...safe
    } = user;
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
        case "s":
            return value * 1000;
        case "m":
            return value * 60 * 1000;
        case "h":
            return value * 60 * 60 * 1000;
        case "d":
            return value * 24 * 60 * 60 * 1000;
        default:
            return 7 * 24 * 60 * 60 * 1000;
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
        const hashedPassword = await hashPassword(password);
        const verificationToken = generateToken();
        const encryptionKey = generateEncryptionKey();

        // Get welcome pack tokens for new signups
        const welcomePack = await settingsRepository.getPack("welcome");
        const freeTokens = welcomePack?.tokens || 0;

        const user = await userRepository.create({
            email: email.trim().toLowerCase(),
            name: name?.trim() || null,
            password: hashedPassword,
            encryptionKey,
            credits: freeTokens,
            isEmailVerified: false,
            emailVerificationToken: hashToken(verificationToken),
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        // Fire-and-forget: Record bonus transaction and send verification email in parallel
        const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

        // Non-blocking operations
        if (freeTokens > 0) {
            transactionRepository
                .createBonus(
                    user._id,
                    freeTokens,
                    freeTokens,
                    `${welcomePack?.name || "Welcome Pack"} - Free signup credits`
                )
                .catch((err) => console.error("[Auth] Failed to log signup bonus:", err.message));
        }
        emailService
            .sendVerificationEmail(user.email, { name: user.name, verificationUrl })
            .catch((err) =>
                console.error("[Auth] Failed to send verification email:", err.message)
            );

        // Generate tokens in parallel
        const [accessToken, refreshToken] = await Promise.all([
            Promise.resolve(generateAccessToken(user)),
            generateRefreshToken(user),
        ]);

        return {
            user: sanitizeUser(user),
            accessToken,
            refreshToken,
            encryptionKey,
            message: "Please check your email to verify your account",
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

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
        return { error: "Invalid email or password", status: 401 };
    }

    // Generate encryption key for old users who don't have one
    if (!user.encryptionKey) {
        user.encryptionKey = generateEncryptionKey();
        await user.save();
    }

    // Generate tokens in parallel
    const [accessToken, refreshToken] = await Promise.all([
        Promise.resolve(generateAccessToken(user)),
        generateRefreshToken(user),
    ]);

    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        encryptionKey: user.encryptionKey,
    };
};

export const verifyEmail = async (token) => {
    if (!token) {
        return { error: "Verification token is required", status: 400 };
    }

    const hashedToken = hashToken(token);

    const user = await userRepository.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
        return { error: "Invalid or expired verification token", status: 400 };
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Fire-and-forget welcome email
    emailService
        .sendWelcomeEmail(user.email, { name: user.name, freeCredits: user.credits || 0 })
        .catch((err) => console.error("[Auth] Failed to send welcome email:", err.message));

    return {
        user: sanitizeUser(user),
        message: "Email verified successfully",
    };
};

export const resendVerificationEmail = async (email) => {
    if (!validateEmail(email)) {
        return { error: "Invalid email format", status: 400 };
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
        return {
            success: true,
            message: "If the email exists, a verification link has been sent",
        };
    }

    if (user.isEmailVerified) {
        return { error: "Email is already verified", status: 400 };
    }

    const verificationToken = generateToken();

    user.emailVerificationToken = hashToken(verificationToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    // Fire-and-forget verification email
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
    emailService
        .sendVerificationEmail(user.email, { name: user.name, verificationUrl })
        .catch((err) => console.error("[Auth] Failed to send verification email:", err.message));

    return {
        success: true,
        message: "Verification email sent",
    };
};

export const forgotPassword = async (email) => {
    if (!validateEmail(email)) {
        return { error: "Invalid email format", status: 400 };
    }

    const user = await userRepository.findByEmail(email);

    if (!user) {
        return {
            success: true,
            message: "If the email exists, a password reset link has been sent",
        };
    }

    const resetToken = generateToken();

    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Fire-and-forget password reset email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    emailService
        .sendForgotPasswordEmail(user.email, { name: user.name, resetUrl })
        .catch((err) => console.error("[Auth] Failed to send password reset email:", err.message));

    return {
        success: true,
        message: "If the email exists, a password reset link has been sent",
    };
};

export const resetPassword = async (token, newPassword) => {
    if (!token) {
        return { error: "Reset token is required", status: 400 };
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        return { error: passwordValidation.message, status: 400 };
    }

    const hashedToken = hashToken(token);

    const user = await userRepository.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
        return { error: "Invalid or expired reset token", status: 400 };
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokens = [];
    await user.save();

    // Fire-and-forget password changed email
    emailService
        .sendPasswordChangedEmail(user.email, { name: user.name })
        .catch((err) =>
            console.error("[Auth] Failed to send password changed email:", err.message)
        );

    return {
        success: true,
        message: "Password reset successfully",
    };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await userRepository.findById(userId);

    if (!user) {
        return { error: "User not found", status: 404 };
    }

    const isValid = await comparePassword(currentPassword, user.password);

    if (!isValid) {
        return { error: "Current password is incorrect", status: 401 };
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        return { error: passwordValidation.message, status: 400 };
    }

    user.password = await hashPassword(newPassword);
    user.refreshTokens = [];
    await user.save();

    // Fire-and-forget password changed email
    emailService
        .sendPasswordChangedEmail(user.email, { name: user.name })
        .catch((err) =>
            console.error("[Auth] Failed to send password changed email:", err.message)
        );

    return {
        success: true,
        message: "Password changed successfully",
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

        // Remove old token and generate new tokens in parallel
        const [, newAccessToken, newRefreshToken] = await Promise.all([
            userRepository.removeRefreshToken(user._id || user.id, decoded.jti),
            Promise.resolve(generateAccessToken(user)),
            generateRefreshToken(user),
        ]);

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
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshAccessToken,
    logout,
    logoutAll,
    verifyAccessToken,
    getUser,
};
