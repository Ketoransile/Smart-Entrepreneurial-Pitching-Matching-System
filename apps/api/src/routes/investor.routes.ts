import { Router } from "express";
import { InvestorController } from "../controllers/investor.controller";
import { authenticate, authorize } from "../middleware/auth";
import {
	investorProfileUpdateValidation,
	investorProfileValidation,
	validate,
} from "../middleware/validation";

const router = Router();

// All investor routes require authentication
router.use(authenticate);
router.use(authorize("investor"));

/**
 * @openapi
 * tags:
 *   - name: Investor
 *     description: Investor profile management
 */

// Profile routes
/**
 * @openapi
 * /api/investor/profile:
 *   post:
 *     tags: [Investor]
 *     summary: Create investor profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, preferredSectors, preferredStages, investmentRange, investmentType]
 *             properties:
 *               fullName:
 *                 type: string
 *               preferredSectors:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredStages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/InvestmentStage'
 *               investmentRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: integer
 *                   max:
 *                     type: integer
 *               investmentType:
 *                 type: array
 *                 items:
 *                   type: string
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
	validate(investorProfileValidation),
	InvestorController.createProfile,
);

/**
 * @openapi
 * /api/investor/profile:
 *   get:
 *     tags: [Investor]
 *     summary: Get current investor profile
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
router.get("/profile", InvestorController.getProfile);

/**
 * @openapi
 * /api/investor/profile:
 *   put:
 *     tags: [Investor]
 *     summary: Update investor profile
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
 *               preferredSectors:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredStages:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/InvestmentStage'
 *               investmentRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: integer
 *                   max:
 *                     type: integer
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
	validate(investorProfileUpdateValidation),
	InvestorController.updateProfile,
);

/**
 * @openapi
 * /api/investor/saved-pitches:
 *   get:
 *     tags: [Investor]
 *     summary: Get all saved pitches for current investor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved pitches fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 savedPitches:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/saved-pitches", InvestorController.getSavedPitches);

/**
 * @openapi
 * /api/investor/saved-pitches/{id}:
 *   post:
 *     tags: [Investor]
 *     summary: Toggle a saved pitch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Pitch / Submission ID
 *     responses:
 *       200:
 *         description: Pitch saved/unsaved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 saved:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/saved-pitches/:id", InvestorController.toggleSavedPitch);

export default router;
