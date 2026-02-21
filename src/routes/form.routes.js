import { Router } from "express";
import { analyzeForm } from "../controllers/form.controller.js";

const router = Router();

/**
 * @swagger
 * /form/analyze:
 *   post:
 *     summary: Analyze form fields and generate fill values
 *     description: Takes form field definitions and returns AI-generated values for each field
 *     tags: [Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyzeFormRequest'
 *     responses:
 *       200:
 *         description: Successfully generated form values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyzeFormResponse'
 *       400:
 *         description: Invalid request - missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: AI processing error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/analyze", analyzeForm);

export default router;
