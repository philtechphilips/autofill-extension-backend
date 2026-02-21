import aiService from "../services/ai.service.js";
import { success, badRequest, error } from "../utils/response.js";

export const analyzeForm = async (req, res, next) => {
    try {
        const { fields, context, pageUrl, pageTitle, fillOnlyEmpty, profileData } = req.body;

        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return badRequest(res, "No fields provided or fields is not a valid array");
        }

        const result = await aiService.analyzeForm({
            fields,
            context,
            pageUrl,
            pageTitle,
            fillOnlyEmpty,
            profileData,
        });

        success(res, result);
    } catch (err) {
        if (err instanceof SyntaxError) {
            return error(res, "AI returned invalid JSON", 500, { raw: err.message });
        }
        next(err);
    }
};

export const enhanceText = async (req, res, next) => {
    try {
        const { text, fieldLabel, context, enhanceType } = req.body;

        if (!text || typeof text !== "string") {
            return badRequest(res, "Text is required");
        }

        if (text.trim().length < 10) {
            return badRequest(res, "Text is too short. Please write at least a sentence.");
        }

        const result = await aiService.enhanceText({
            text,
            fieldLabel,
            context,
            enhanceType,
        });

        success(res, result);
    } catch (err) {
        next(err);
    }
};

export const parseCV = async (req, res, next) => {
    try {
        const { cvText } = req.body;

        if (!cvText || typeof cvText !== "string") {
            return badRequest(res, "CV text content is required");
        }

        if (cvText.trim().length < 50) {
            return badRequest(res, "CV content is too short. Please provide more content.");
        }

        const result = await aiService.parseCV(cvText);

        success(res, result);
    } catch (err) {
        if (err instanceof SyntaxError) {
            return error(res, "Failed to parse CV data", 500, { raw: err.message });
        }
        next(err);
    }
};
