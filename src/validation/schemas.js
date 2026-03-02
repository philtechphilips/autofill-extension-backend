import Joi from "joi";

// ─── Reusable primitives ─────────────────────────────────────────────────────

const email = Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .required();

const password = Joi.string().min(8).required();

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = Joi.object({
    email,
    password,
    name: Joi.string().trim().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
    email,
    password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
    token: Joi.string().required(),
});

export const resendVerificationSchema = Joi.object({ email });

export const forgotPasswordSchema = Joi.object({ email });

export const resetPasswordSchema = Joi.object({
    token: Joi.string().required(),
    password,
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
});

// refreshToken may come from httpOnly cookie – body field is optional
export const refreshSchema = Joi.object({
    refreshToken: Joi.string().optional(),
});

export const logoutSchema = Joi.object({
    refreshToken: Joi.string().optional(),
});

// ─── Form (AI) ───────────────────────────────────────────────────────────────

export const analyzeFormSchema = Joi.object({
    fields: Joi.array().items(Joi.object().unknown(true)).min(1).required(),
    context: Joi.string().max(500).optional().allow("", null),
    pageUrl: Joi.string().max(2000).optional().allow("", null),
    pageTitle: Joi.string().max(500).optional().allow("", null),
    fillOnlyEmpty: Joi.boolean().optional(),
    profileData: Joi.alternatives()
        .try(Joi.object().unknown(true), Joi.array())
        .optional()
        .allow(null),
    cvData: Joi.object().unknown(true).optional().allow(null),
});

export const enhanceTextSchema = Joi.object({
    text: Joi.string().min(10).required(),
    fieldLabel: Joi.string().max(200).optional().allow("", null),
    context: Joi.string().max(500).optional().allow("", null),
    enhanceType: Joi.string()
        .valid("professional", "concise", "detailed", "friendly", "formal", "creative")
        .optional()
        .default("professional"),
});

export const generateTextSchema = Joi.object({
    fieldLabel: Joi.string().required(),
    context: Joi.string().max(500).optional().allow("", null),
});

export const parseCVSchema = Joi.object({
    cvText: Joi.string().min(1).optional(),
    pdfBase64: Joi.string().min(1).optional(),
    docxBase64: Joi.string().min(1).optional(),
    fileName: Joi.string().optional().allow("", null),
}).or("cvText", "pdfBase64", "docxBase64");

// ─── Profiles ────────────────────────────────────────────────────────────────

export const createProfileSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    encryptedData: Joi.string().required(),
    iv: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    encryptedData: Joi.string().optional(),
    iv: Joi.string().optional(),
}).or("name", "encryptedData", "iv");

export const syncProfilesSchema = Joi.object({
    profiles: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().trim().min(1).max(100).required(),
                encryptedData: Joi.string().required(),
                iv: Joi.string().required(),
            })
        )
        .required(),
});

// ─── Analytics ───────────────────────────────────────────────────────────────

export const recordEventSchema = Joi.object({
    type: Joi.string().valid("form_fill", "cv_parse", "text_enhance").required(),
    domain: Joi.string().max(500).optional().allow("", null),
    pageTitle: Joi.string().max(500).optional().allow("", null),
    fieldCount: Joi.number().integer().min(0).optional(),
    success: Joi.boolean().optional(),
    profileId: Joi.string().optional().allow("", null),
    fillMode: Joi.string().valid("ai_only", "profile_only", "merged").optional().allow("", null),
    metadata: Joi.object().unknown(true).optional().allow(null),
});

export const getEventsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    type: Joi.string().valid("form_fill", "cv_parse", "text_enhance").optional(),
});

export const getRecentQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(20).optional().default(6),
});

export const getDailyQuerySchema = Joi.object({
    days: Joi.number().integer().min(1).max(90).optional().default(30),
});

// ─── Payment ─────────────────────────────────────────────────────────────────

export const checkoutSchema = Joi.object({
    packId: Joi.string().valid("welcome", "pro", "elite").required(),
});

export const getTransactionsQuerySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    skip: Joi.number().integer().min(0).optional().default(0),
    type: Joi.string().valid("purchase", "usage", "refund").optional(),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const updateTokenCostsSchema = Joi.object({
    formAnalysis: Joi.number().min(0).optional(),
    textEnhancement: Joi.number().min(0).optional(),
    textGeneration: Joi.number().min(0).optional(),
    cvParsing: Joi.number().min(0).optional(),
    profileUsage: Joi.number().min(0).optional(),
}).or("formAnalysis", "textEnhancement", "textGeneration", "cvParsing", "profileUsage");

export const updatePackSchema = Joi.object({
    name: Joi.string().trim().min(1).optional(),
    tokens: Joi.number().integer().min(0).optional(),
    priceNGN: Joi.number().min(0).optional(),
    priceUSD: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
}).or("name", "tokens", "priceNGN", "priceUSD", "isActive");

export const getPaymentAnalyticsQuerySchema = Joi.object({
    period: Joi.string().valid("7d", "30d", "90d", "all").optional().default("30d"),
});

export const getAllTransactionsQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    type: Joi.string().valid("purchase", "usage", "refund").optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
});

// ─── Contact ─────────────────────────────────────────────────────────────────

export const contactSchema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .trim()
        .required(),
    message: Joi.string().trim().min(10).max(5000).required(),
});
