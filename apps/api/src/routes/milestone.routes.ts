import { Router } from "express";
import { MilestoneController } from "../controllers/milestone.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Milestones
 *     description: Funding milestone tracking and simulated payment release workflow
 */

/**
 * @openapi
 * /api/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a new funding milestone for an accepted match
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [submissionId, matchResultId, title, amount, dueDate]
 *             properties:
 *               submissionId:
 *                 type: string
 *               matchResultId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               currency:
 *                 type: string
 *                 example: USD
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Milestone created and escrow held
 */
router.post(
	"/",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.create,
);

/**
 * @openapi
 * /api/milestones:
 *   get:
 *     tags: [Milestones]
 *     summary: List milestones visible to current actor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: submissionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: matchResultId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, in_progress, submitted, approved, rejected, paid, cancelled]
 *     responses:
 *       200:
 *         description: Milestones fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 milestones:
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
router.get(
	"/",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.list,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get milestone details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 milestone:
 *                   type: object
 *       404:
 *         description: Milestone not found
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
router.get(
	"/:milestoneId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.getById,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   patch:
 *     tags: [Milestones]
 *     summary: Update milestone details or move to in_progress/cancelled
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [planned, in_progress, cancelled]
 *     responses:
 *       200:
 *         description: Milestone updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 milestone:
 *                   type: object
 *       404:
 *         description: Milestone not found
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
	"/:milestoneId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.update,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}/evidence:
 *   post:
 *     tags: [Milestones]
 *     summary: Submit completion evidence for milestone verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [evidenceDocuments]
 *             properties:
 *               evidenceDocuments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, url]
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [invoice, report, delivery_note, photo, video, other]
 *     responses:
 *       200:
 *         description: Evidence submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 */
router.post(
	"/:milestoneId/evidence",
	authenticate,
	authorize("entrepreneur", "admin"),
	MilestoneController.submitEvidence,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}/verify:
 *   post:
 *     tags: [Milestones]
 *     summary: Verify milestone and release simulated payout
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [approved]
 *             properties:
 *               approved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Milestone verification handled
 */
router.post(
	"/:milestoneId/verify",
	authenticate,
	authorize("investor", "admin"),
	MilestoneController.verify,
);

export default router;
