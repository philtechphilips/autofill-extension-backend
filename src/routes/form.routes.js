import { Router } from "express";
import { analyzeForm, enhanceText, parseCV } from "../controllers/form.controller.js";

const router = Router();

/**
 * @swagger
 * /form/analyze:
 *   post:
 *     summary: Analyze form fields and generate fill values
 *     description: Takes form field definitions and returns AI-generated values. Can use CV/profile data for personalized filling.
 *     tags: [Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fields
 *             properties:
 *               fields:
 *                 type: array
 *                 description: Array of form field definitions
 *               context:
 *                 type: string
 *                 description: Context about the form purpose
 *               pageUrl:
 *                 type: string
 *                 description: URL of the page containing the form
 *               pageTitle:
 *                 type: string
 *                 description: Title of the page
 *               fillOnlyEmpty:
 *                 type: boolean
 *                 description: Only fill empty fields
 *               cvData:
 *                 type: object
 *                 description: Parsed CV data to use for filling (personal, work_experience, education, skills)
 *               profileData:
 *                 type: object
 *                 description: User profile data to use for filling
 *     responses:
 *       200:
 *         description: Successfully generated form values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyzeFormResponse'
 *       400:
 *         description: Invalid request - missing or invalid fields
 *       500:
 *         description: AI processing error
 */
router.post("/analyze", analyzeForm);

/**
 * @swagger
 * /form/enhance:
 *   post:
 *     summary: Enhance text using AI
 *     description: Improves user-written text for cover letters, bios, descriptions, etc.
 *     tags: [Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to enhance
 *                 example: "I am a software developer with 5 years experience. I want to work at your company."
 *               fieldLabel:
 *                 type: string
 *                 description: The label of the form field (for context)
 *                 example: "Cover Letter"
 *               context:
 *                 type: string
 *                 description: Additional context about the form
 *                 example: "Job application for Senior Developer position"
 *               enhanceType:
 *                 type: string
 *                 enum: [professional, concise, detailed, friendly, formal, creative]
 *                 default: professional
 *                 description: The type of enhancement to apply
 *     responses:
 *       200:
 *         description: Successfully enhanced text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     original:
 *                       type: string
 *                     enhanced:
 *                       type: string
 *       400:
 *         description: Invalid request - text too short or missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/enhance", enhanceText);

/**
 * @swagger
 * /form/parse-cv:
 *   post:
 *     summary: Parse CV/Resume and extract structured data
 *     description: Extracts personal info, work experience, education, skills from CV text
 *     tags: [Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cvText
 *             properties:
 *               cvText:
 *                 type: string
 *                 description: The full text content of the CV/Resume
 *     responses:
 *       200:
 *         description: Successfully parsed CV
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     personal:
 *                       type: object
 *                     work_experience:
 *                       type: array
 *                     education:
 *                       type: array
 *                     skills:
 *                       type: object
 *                     certifications:
 *                       type: array
 *       400:
 *         description: Invalid request - CV text missing or too short
 */
router.post("/parse-cv", parseCV);

export default router;
