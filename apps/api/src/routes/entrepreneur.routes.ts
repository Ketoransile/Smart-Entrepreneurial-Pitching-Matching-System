import { Router } from "express";
import { EntrepreneurController } from "../controllers/entrepreneur.controller";
import { authenticate, authorize } from "../middleware/auth";
import {
	entrepreneurProfileUpdateValidation,
	entrepreneurProfileValidation,
	validate,
} from "../middleware/validation";

const router = Router();

// All entrepreneur routes require authentication
router.use(authenticate);
router.use(authorize("entrepreneur"));

/**
 * @openapi
 * tags:
 *   - name: Entrepreneur
 *     description: Entrepreneur profile management
 */

// Profile routes
/**
 * @openapi
 * /api/entrepreneur/profile:
 *   post:
 *     tags: [Entrepreneur]
 *     summary: Create entrepreneur profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, companyName, companyRegistrationNumber, businessSector, businessStage]
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               companyRegistrationNumber:
 *                 type: string
 *               businessSector:
 *                 type: string
 *               businessStage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profile created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 profile:
 *                   type: object
 *       400:
 *         description: Validation or duplicate profile error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/profile",
	validate(entrepreneurProfileValidation),
	EntrepreneurController.createProfile,
);

/**
 * @openapi
 * /api/entrepreneur/profile:
 *   get:
 *     tags: [Entrepreneur]
 *     summary: Get current entrepreneur profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 profile:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/profile", EntrepreneurController.getProfile);

/**
 * @openapi
 * /api/entrepreneur/profile:
 *   put:
 *     tags: [Entrepreneur]
 *     summary: Update entrepreneur profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               website:
 *                 type: string
 *               businessStage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 profile:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
	"/profile",
	validate(entrepreneurProfileUpdateValidation),
	EntrepreneurController.updateProfile,
);

/**
 * @openapi
 * /api/entrepreneur/profile/check:
 *   get:
 *     tags: [Entrepreneur]
 *     summary: Check if current entrepreneur has a profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile existence returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 exists:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/profile/check", EntrepreneurController.checkProfile);

export default router;
