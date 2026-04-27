import { Router } from "express";
import { MatchingController } from "../controllers/matching.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Matching
 *     description: AI-powered investor matching workflow
 */

/**
 * @openapi
 * /api/matching/submissions/{submissionId}/run:
 *   post:
 *     tags: [Matching]
 *     summary: Run AI analysis and matching for a submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 description: Maximum number of matches to return
 *               minScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Minimum match score threshold
 *     responses:
 *       200:
 *         description: Matching completed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MatchResultObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/submissions/:submissionId/run",
	authenticate,
	authorize("entrepreneur", "admin"),
	MatchingController.runForSubmission,
);

/**
 * @openapi
 * /api/matching/submissions/{submissionId}:
 *   get:
 *     tags: [Matching]
 *     summary: Get match results for a submission
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
 *         description: Matches fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MatchResultObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/submissions/:submissionId",
	authenticate,
	MatchingController.getSubmissionMatches,
);

/**
 * @openapi
 * /api/matching/me/investor:
 *   get:
 *     tags: [Matching]
 *     summary: Get current investor match queue
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, expired]
 *     responses:
 *       200:
 *         description: Investor matches fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MatchResultObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/me/investor",
	authenticate,
	authorize("investor"),
	MatchingController.getInvestorMatches,
);

/**
 * @openapi
 * /api/matching/{matchId}/status:
 *   patch:
 *     tags: [Matching]
 *     summary: Investor accepts or declines a match
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *     responses:
 *       200:
 *         description: Match status updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     match:
 *                       $ref: '#/components/schemas/MatchResultObject'
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Match not found
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
router.patch(
	"/:matchId/status",
	authenticate,
	authorize("investor"),
	MatchingController.updateInvestorMatchStatus,
);

export default router;
