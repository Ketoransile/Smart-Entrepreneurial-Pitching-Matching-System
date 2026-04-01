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
 *       400:
 *         description: Validation or duplicate profile error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
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
 *       401:
 *         description: Unauthorized
 */
router.get("/profile/check", EntrepreneurController.checkProfile);

export default router;
