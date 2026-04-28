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

// ─────────────────────────────────────────────────────────────────────────────
// Milestone CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a new funding milestone (Entrepreneur only)
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
 *         description: Milestone created
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
 *           enum: [planned, in_progress, submitted, approved, rejected, paid, cancelled, pending, submitted_for_review, verified_paid]
 *     responses:
 *       200:
 *         description: Milestones fetched
 */
router.get(
	"/",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.list,
);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: Static path segments (/single/:id, /:projectId) must be declared
// BEFORE dynamic /:milestoneId routes to avoid Express route shadowing.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/milestones/single/{id}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get single milestone details
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
 *         description: Milestone returned
 */
router.get(
	"/single/:milestoneId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.getById,
);

/**
 * @openapi
 * /api/milestones/{projectId}:
 *   get:
 *     tags: [Milestones]
 *     summary: Get all milestones for a project (submissionId)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project milestones returned
 */
router.get(
	"/:projectId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.listByProject,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   put:
 *     tags: [Milestones]
 *     summary: Update milestone details (only when status is "pending")
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
 */
router.put(
	"/:milestoneId",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.update,
);

// ─────────────────────────────────────────────────────────────────────────────
// Milestone Workflow — centralized status transition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/milestones/{milestoneId}/status:
 *   patch:
 *     tags: [Milestones]
 *     summary: Transition milestone status (centralized workflow)
 *     description: |
 *       State machine:
 *       - **submitted_for_review**: Entrepreneur only, milestone must be "pending"
 *       - **verified_paid**: Investor only, milestone must be "submitted_for_review" — triggers simulated payment and creates a TransactionLog
 *       - **rejected**: Investor only, milestone must be "submitted_for_review" — saves feedback
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [submitted_for_review, verified_paid, rejected]
 *               feedback:
 *                 type: string
 *                 description: Optional feedback (used when rejecting)
 *     responses:
 *       200:
 *         description: Status transitioned
 *       400:
 *         description: Invalid status or transition not allowed
 *       403:
 *         description: Role not permitted for this transition
 */
router.patch(
	"/:milestoneId/status",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.transitionStatus,
);

// ─────────────────────────────────────────────────────────────────────────────
// Proof handling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/milestones/{milestoneId}/proof:
 *   post:
 *     tags: [Milestones]
 *     summary: Upload or attach proof (Entrepreneur only)
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
 *             required: [proof]
 *             properties:
 *               proof:
 *                 type: string
 *                 description: Proof URL or descriptive text
 *     responses:
 *       200:
 *         description: Proof attached
 *       403:
 *         description: Only the entrepreneur can upload proof
 */
router.post(
	"/:milestoneId/proof",
	authenticate,
	authorize("entrepreneur", "admin"),
	MilestoneController.uploadProof,
);

/**
 * @openapi
 * /api/milestones/{milestoneId}/proof:
 *   get:
 *     tags: [Milestones]
 *     summary: Retrieve milestone proof
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
 *         description: Proof retrieved
 */
router.get(
	"/:milestoneId/proof",
	authenticate,
	authorize("entrepreneur", "investor", "admin"),
	MilestoneController.getProof,
);

// ─────────────────────────────────────────────────────────────────────────────
// Evidence documents (rich file-based proof — existing workflow)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/milestones/{milestoneId}/evidence:
 *   post:
 *     tags: [Milestones]
 *     summary: Submit completion evidence documents for verification
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
 *     summary: Verify milestone and release simulated payout (Investor only)
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

/**
 * @openapi
 * /api/milestones/{milestoneId}:
 *   delete:
 *     tags: [Milestones]
 *     summary: Delete a pending milestone (Investor or Admin only)
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
 *         description: Milestone deleted
 *       400:
 *         description: Milestone is not in pending status
 *       403:
 *         description: Only the investor can delete this milestone
 */

router.delete(
	"/:milestoneId",
	authenticate,
	authorize("investor", "admin"),
	MilestoneController.delete,
);

export default router;
