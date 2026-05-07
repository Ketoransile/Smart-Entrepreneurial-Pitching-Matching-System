import { Router } from "express";
import { SubmissionController } from "../controllers/submission.controller";
import { authenticate, authorize } from "../middleware/auth";
import {
	createSubmissionValidation,
	updateSubmissionValidation,
} from "../middleware/submission.validation";
import { validate } from "../middleware/validation";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Submissions
 *     description: Entrepreneur pitch drafting and submission workflows
 */

/**
 * @openapi
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Create a new pitch draft
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               sector:
 *                 type: string
 *               stage:
 *                 type: string
 *                 enum: [idea, mvp, early-revenue, scaling]
 *     responses:
 *       201:
 *         description: Draft created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, submission]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                   example: Draft created
 *                 submission:
 *                   type: object
 *       403:
 *         description: User is not verified
 */
router.post(
	"/",
	authenticate,
	authorize("entrepreneur"),
	validate(createSubmissionValidation),
	SubmissionController.createDraft,
);

/**
 * @openapi
 * /api/submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: List entrepreneur submissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Submission list fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, submissions]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 count:
 *                   type: integer
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
	"/",
	authenticate,
	authorize("entrepreneur"),
	SubmissionController.listMine,
);

/**
 * @openapi
 * /api/submissions/feed/browse:
 *   get:
 *     tags: [Submissions]
 *     summary: Investor browse feed of submitted pitches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sector
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, score, amount_high, amount_low]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Feed fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, total, page, totalPages, submissions]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
	"/feed/browse",
	authenticate,
	authorize("investor"),
	SubmissionController.browseFeed,
);

/**
 * @openapi
 * /api/submissions/admin/all:
 *   get:
 *     tags: [Submissions]
 *     summary: Admin list all submissions with stats
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Admin submissions fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, total, page, totalPages, submissions, stats]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 stats:
 *                   type: object
 */
router.get(
	"/admin/all",
	authenticate,
	authorize("admin"),
	SubmissionController.listAdmin,
);

/**
 * @openapi
 * /api/submissions/{id}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get submission by id
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
 *         description: Submission fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, submission]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 submission:
 *                   type: object
 *       404:
 *         description: Submission not found
 */
router.get("/:id", authenticate, SubmissionController.getOne);

/**
 * @openapi
 * /api/submissions/{id}:
 *   patch:
 *     tags: [Submissions]
 *     summary: Update a draft submission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               summary:
 *                 type: string
 *               sector:
 *                 type: string
 *               stage:
 *                 type: string
 *                 enum: [idea, mvp, early-revenue, scaling]
 *               targetAmount:
 *                 type: number
 *               currentStep:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Draft updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, submission]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                   example: Draft saved
 *                 submission:
 *                   type: object
 *       400:
 *         description: Validation or status error
 */
router.patch(
	"/:id",
	authenticate,
	authorize("entrepreneur"),
	validate(updateSubmissionValidation),
	SubmissionController.updateDraft,
);

/**
 * @openapi
 * /api/submissions/{id}/submit:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit a draft pitch for review
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
 *         description: Pitch submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, submission]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                   example: Pitch submitted for AI review
 *                 submission:
 *                   type: object
 *       400:
 *         description: Incomplete or invalid draft
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, errors]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [error]
 *                 message:
 *                   type: string
 *                   example: Incomplete submission
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.post(
	"/:id/submit",
	authenticate,
	authorize("entrepreneur"),
	SubmissionController.submit,
);

/**
 * @openapi
 * /api/submissions/{id}/completeness:
 *   get:
 *     tags: [Submissions]
 *     summary: Get document completeness score and required checklist
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
 *         description: Completeness result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, completeness]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 completeness:
 *                   type: object
 */
router.get(
	"/:id/completeness",
	authenticate,
	authorize("entrepreneur"),
	SubmissionController.getCompleteness,
);

/**
 * @openapi
 * /api/submissions/{id}:
 *   delete:
 *     tags: [Submissions]
 *     summary: Delete a draft submission
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
 *         description: Draft deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                   example: Draft deleted
 *       404:
 *         description: Draft not found
 */
router.delete(
	"/:id",
	authenticate,
	authorize("entrepreneur"),
	SubmissionController.removeDraft,
);

/**
 * @openapi
 * /api/submissions/{id}/status:
 *   patch:
 *     tags: [Submissions]
 *     summary: Admin update submission status (SC-17 Final Approval)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *                 enum: [approved, rejected, suspended]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, submission]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                 submission:
 *                   type: object
 */
router.patch(
	"/:id/status",
	authenticate,
	authorize("admin", "super_admin"),
	SubmissionController.updateStatusAdmin,
);

/**
 * @openapi
 * /api/submissions/{id}/generate-summary:
 *   post:
 *     tags: [Submissions]
 *     summary: Admin (re)generate Gemini AI pitch summary
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
 *         description: AI summary generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, summary]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [success]
 *                 message:
 *                   type: string
 *                   example: AI summary generated successfully
 *                 summary:
 *                   type: object
 *       404:
 *         description: Submission not found
 */
router.post(
	"/:id/generate-summary",
	authenticate,
	authorize("admin", "super_admin"),
	SubmissionController.generateSummary,
);

/**
 * @openapi
 * /api/submissions/{id}/summary-status:
 *   get:
 *     tags: [Submissions]
 *     summary: Lightweight poll for AI summary generation status
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
 *         description: Summary status
 *       404:
 *         description: Submission not found
 */
router.get(
	"/:id/summary-status",
	authenticate,
	SubmissionController.getSummaryStatus,
);

export default router;
