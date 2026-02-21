import aiService from "../services/ai.service.js";
import { success, badRequest, error } from "../utils/response.js";

export const analyzeForm = async (req, res, next) => {
    try {
        const { fields, context, pageUrl, pageTitle, fillOnlyEmpty } = req.body;

        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return badRequest(res, "No fields provided or fields is not a valid array");
        }

        const result = await aiService.analyzeForm({
            fields,
            context,
            pageUrl,
            pageTitle,
            fillOnlyEmpty,
        });

        success(res, result);
    } catch (err) {
        if (err instanceof SyntaxError) {
            return error(res, "AI returned invalid JSON", 500, { raw: err.message });
        }
        next(err);
    }
};
