import { Router } from "express";
import { success, error } from "../utils/response.js";
import { sendContactMessage } from "../services/email.service.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";
import { contactSchema } from "../validation/schemas.js";

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
router.post("/", contactLimiter, validateBody(contactSchema), async (req, res) => {
    try {
        // name, email, message are already validated and trimmed/lowercased by Joi
        const { name, email, message } = req.body;

        const result = await sendContactMessage({ name, email, message });

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
