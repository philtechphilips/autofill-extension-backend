import aiService from "../services/ai.service.js";
import { success, badRequest, error } from "../utils/response.js";
import { extractTextFromPDF, extractTextFromDOCX } from "../utils/parser.js";

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
        const { cvText, pdfBase64, docxBase64, fileName } = req.body;

        let textContent = cvText;

        // Handle PDF file
        if (pdfBase64) {
            try {
                const pdfBuffer = Buffer.from(pdfBase64, "base64");
                textContent = await extractTextFromPDF(pdfBuffer);
            } catch (pdfErr) {
                return badRequest(res, `Failed to parse PDF: ${pdfErr.message}`);
            }
        }

        // Handle DOCX file
        if (docxBase64) {
            try {
                const docxBuffer = Buffer.from(docxBase64, "base64");
                textContent = await extractTextFromDOCX(docxBuffer);
            } catch (docxErr) {
                return badRequest(res, `Failed to parse DOCX: ${docxErr.message}`);
            }
        }

        if (!textContent || typeof textContent !== "string") {
            return badRequest(res, "CV text content is required");
        }

        if (textContent.trim().length < 50) {
            return badRequest(res, "CV content is too short. Please provide more content.");
        }

        const result = await aiService.parseCV(textContent);

        success(res, result);
    } catch (err) {
        if (err instanceof SyntaxError) {
            return error(res, "Failed to parse CV data", 500, { raw: err.message });
        }
        next(err);
    }
};
