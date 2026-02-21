import { Router } from "express";
import profileController from "../controllers/profile.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Get all profiles
 *     description: Retrieve all encrypted profiles for the authenticated user
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of profiles
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
 *                     profiles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Not authenticated
 */
router.get("/", authenticate, profileController.getProfiles);

/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Create a new profile
 *     description: Create a new encrypted profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileCreateRequest'
 *     responses:
 *       201:
 *         description: Profile created
 *       400:
 *         description: Invalid input or max profiles reached
 *       409:
 *         description: Profile name already exists
 */
router.post("/", authenticate, profileController.createProfile);

/**
 * @swagger
 * /profiles/sync:
 *   post:
 *     summary: Sync all profiles
 *     description: Replace all profiles with the provided list (bulk sync from extension)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profiles
 *             properties:
 *               profiles:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProfileCreateRequest'
 *     responses:
 *       200:
 *         description: Profiles synced successfully
 *       400:
 *         description: Invalid input
 */
router.post("/sync", authenticate, profileController.syncProfiles);

/**
 * @swagger
 * /profiles/{id}:
 *   get:
 *     summary: Get a profile by ID
 *     description: Retrieve a specific encrypted profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile data
 *       404:
 *         description: Profile not found
 */
router.get("/:id", authenticate, profileController.getProfile);

/**
 * @swagger
 * /profiles/{id}:
 *   put:
 *     summary: Update a profile
 *     description: Update an existing encrypted profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdateRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         description: Profile not found
 */
router.put("/:id", authenticate, profileController.updateProfile);

/**
 * @swagger
 * /profiles/{id}:
 *   delete:
 *     summary: Delete a profile
 *     description: Delete an encrypted profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profile deleted
 *       404:
 *         description: Profile not found
 */
router.delete("/:id", authenticate, profileController.deleteProfile);

/**
 * @swagger
 * /profiles/{id}/default:
 *   post:
 *     summary: Set default profile
 *     description: Set a profile as the default
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default profile updated
 *       404:
 *         description: Profile not found
 */
router.post("/:id/default", authenticate, profileController.setDefaultProfile);

export default router;
