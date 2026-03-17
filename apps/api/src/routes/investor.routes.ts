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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put(
	"/profile",
	validate(investorProfileUpdateValidation),
	InvestorController.updateProfile,
);

export default router;
