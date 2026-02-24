import { Router } from "express";
import { success, error } from "../utils/response.js";
import { sendContactMessage } from "../services/email.service.js";
import { contactLimiter } from "../middleware/rateLimiter.js";

const router = Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Send a contact message
 *     description: Submit a contact form message. Rate limited to 3 messages per hour per IP.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Sender's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Sender's email address
 *               message:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Failed to send message
 */
router.post("/", contactLimiter, async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return error(res, "Name must be at least 2 characters", 400);
        }

        if (name.length > 100) {
            return error(res, "Name must be less than 100 characters", 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return error(res, "Please provide a valid email address", 400);
        }

        if (!message || typeof message !== "string" || message.trim().length < 10) {
            return error(res, "Message must be at least 10 characters", 400);
        }

        if (message.length > 5000) {
            return error(res, "Message must be less than 5000 characters", 400);
        }

        const sanitizedName = name.trim().slice(0, 100);
        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedMessage = message.trim().slice(0, 5000);

        const result = await sendContactMessage({
            name: sanitizedName,
            email: sanitizedEmail,
            message: sanitizedMessage,
        });

        if (!result.success) {
            console.error("[Contact] Failed to send message:", result.error);
            return error(res, "Failed to send message. Please try again later.", 500);
        }

        return success(res, { message: "Message sent successfully" });
    } catch (err) {
        console.error("[Contact] Error:", err);
        return error(res, "Failed to send message. Please try again later.", 500);
    }
});

export default router;
