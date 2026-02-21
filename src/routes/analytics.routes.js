import { Router } from "express";
import analyticsController from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /analytics/event:
 *   post:
 *     summary: Record a usage event
 *     description: Record a form fill, CV parse, or text enhancement event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [form_fill, cv_parse, text_enhance]
 *               domain:
 *                 type: string
 *               pageTitle:
 *                 type: string
 *               fieldCount:
 *                 type: number
 *               success:
 *                 type: boolean
 *               profileId:
 *                 type: string
 *               fillMode:
 *                 type: string
 *                 enum: [ai_only, profile_only, merged]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event recorded
 *       400:
 *         description: Invalid event type
 *       401:
 *         description: Not authenticated
 */
router.post("/event", authenticate, analyticsController.recordEvent);

/**
 * @swagger
 * /analytics/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Get aggregated usage statistics for the dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalFills:
 *                           type: number
 *                         totalFieldsFilled:
 *                           type: number
 *                         timeSavedHours:
 *                           type: number
 *                         successRate:
 *                           type: number
 *       401:
 *         description: Not authenticated
 */
router.get("/stats", authenticate, analyticsController.getStats);

/**
 * @swagger
 * /analytics/events:
 *   get:
 *     summary: Get usage events
 *     description: Get paginated list of usage events for history
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [form_fill, cv_parse, text_enhance]
 *     responses:
 *       200:
 *         description: List of events with pagination
 *       401:
 *         description: Not authenticated
 */
router.get("/events", authenticate, analyticsController.getEvents);

/**
 * @swagger
 * /analytics/recent:
 *   get:
 *     summary: Get recent events
 *     description: Get most recent usage events for activity feed
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: List of recent events
 *       401:
 *         description: Not authenticated
 */
router.get("/recent", authenticate, analyticsController.getRecentEvents);

/**
 * @swagger
 * /analytics/daily:
 *   get:
 *     summary: Get daily statistics
 *     description: Get daily fill counts for the usage chart
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daily statistics
 *       401:
 *         description: Not authenticated
 */
router.get("/daily", authenticate, analyticsController.getDailyStats);

export default router;
