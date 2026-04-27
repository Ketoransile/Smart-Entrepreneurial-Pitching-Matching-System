import { Router } from "express";
import { InvestorController } from "../controllers/investor.controller";
import { authenticate, authorize } from "../middleware/auth";
import {
	investorProfileUpdateValidation,
	investorProfileValidation,
	validate,
} from "../middleware/validation";

const router = Router();

router.use(authenticate);
router.use(authorize("investor"));

/**
 * @openapi
 * tags:
 *   - name: Investor
 *     description: Investor profile management
 */

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
 *             required: [fullName, preferredSectors, preferredStages, investmentRange]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Jane Smith"
 *               investmentFirm:
 *                 type: string
 *               position:
 *                 type: string
 *               preferredSectors:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [technology, healthcare, agriculture, finance, education, retail, manufacturing, energy, transportation, other]
 *               preferredStages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [idea, mvp, early-revenue, scaling]
 *               investmentRange:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: integer
 *                     example: 10000
 *                   max:
 *                     type: integer
 *                     example: 500000
 *               investmentType:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [equity, debt, grant, convertible-note]
 *     responses:
 *       201:
 *         description: Profile created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/InvestorProfileObject'
 *       400:
 *         description: Validation or duplicate profile error
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
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/InvestorProfileObject'
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
 *               investmentFirm:
 *                 type: string
 *               position:
 *                 type: string
 *               preferredSectors:
 *                 type: array
 *                 items:
 *                   type: string
 *               preferredStages:
 *                 type: array
 *                 items:
 *                   type: string
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
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/InvestorProfileObject'
 *       400:
 *         description: Validation error
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
 * /api/investor/profile/check:
 *   get:
 *     tags: [Investor]
 *     summary: Check if current investor has a profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile existence returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 */
router.get("/profile/check", async (req, res) => {
	const { InvestorProfile } = await import("../models/InvestorProfile");
	const profile = await InvestorProfile.findOne({
		userId: (req as any).user?._id,
	});
	res.json({ status: "success", exists: !!profile });
});

/**
 * @openapi
 * /api/investor/saved-pitches:
 *   get:
 *     tags: [Investor]
 *     summary: List saved pitches
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved pitches fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     submissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SubmissionObject'
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
 * /api/investor/saved-pitches/{submissionId}:
 *   post:
 *     tags: [Investor]
 *     summary: Save a pitch to bookmarks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pitch saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/saved-pitches/:id", InvestorController.toggleSavedPitch);

/**
 * @openapi
 * /api/investor/saved-pitches/{submissionId}:
 *   delete:
 *     tags: [Investor]
 *     summary: Remove a pitch from bookmarks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pitch removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/saved-pitches/:id", InvestorController.toggleSavedPitch);

export default router;
