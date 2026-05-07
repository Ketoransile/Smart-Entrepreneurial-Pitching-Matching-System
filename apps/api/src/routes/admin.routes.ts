import { Router } from "express";
import { AdminAnalyticsController } from "../controllers/admin/analytics.controller";
import { AdminSubmissionController } from "../controllers/admin/submission.controller";
import { AdminUserController } from "../controllers/admin/user.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate, authorize("admin"));

/**
 * @openapi
 * tags:
 *   - name: Admin
 *     description: Admin dashboard, moderation, and analytics operations
 */

/**
 * @openapi
 * /api/admin/dashboard/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get dashboard statistics for admin console
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, stats]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 stats:
 *                   type: object
 */
router.get("/dashboard/stats", AdminAnalyticsController.getDashboardStats);

/**
 * @openapi
 * /api/admin/analytics/actions:
 *   get:
 *     tags: [Admin]
 *     summary: List recent admin audit actions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit actions fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, actions]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 actions:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/analytics/actions", AdminAnalyticsController.listAuditActions);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List users with filters and pagination
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/users", AdminUserController.listUsers);

/**
 * @openapi
 * /api/admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a user details with role-specific profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 user:
 *                   type: object
 *                 profile:
 *                   type: object
 */
router.get("/users/:userId", AdminUserController.getUser);

/**
 * @openapi
 * /api/admin/users/{userId}/profile:
 *   get:
 *     tags: [Admin]
 *     summary: Get full profile and KYC details for a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 user:
 *                   type: object
 *                 profile:
 *                   type: object
 *       404:
 *         description: User not found
 */
router.get("/users/:userId/profile", AdminUserController.getUser);

/**
 * @openapi
 * /api/admin/users/{userId}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update verification status for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *                 enum: [unverified, pending, verified, suspended]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
router.patch("/users/:userId/status", AdminUserController.updateUserStatus);

/**
 * @openapi
 * /api/admin/users/{userId}/active:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate or deactivate a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User active status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, user]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
router.patch("/users/:userId/active", AdminUserController.setUserActive);

/**
 * @openapi
 * /api/admin/submissions:
 *   get:
 *     tags: [Admin]
 *     summary: List submissions for admin moderation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Submissions fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/submissions", AdminSubmissionController.listSubmissions);

/**
 * @openapi
 * /api/admin/submissions/{submissionId}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Review a submission and record moderation decision
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Submission reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, submission]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 submission:
 *                   type: object
 *       404:
 *         description: Submission not found
 */
router.patch(
	"/submissions/:submissionId/review",
	AdminSubmissionController.reviewSubmission,
);

/**
 * @openapi
 * /api/admin/submissions/{submissionId}/close:
 *   patch:
 *     tags: [Admin]
 *     summary: Force-close a submission
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
 *         description: Submission closed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, submission]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 submission:
 *                   type: object
 *       404:
 *         description: Submission not found
 */
router.patch(
	"/submissions/:submissionId/close",
	AdminSubmissionController.forceCloseSubmission,
);

/**
 * @openapi
 * /api/admin/documents:
 *   get:
 *     tags: [Admin]
 *     summary: List uploaded documents for review
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get("/documents", AdminSubmissionController.listDocuments);

/**
 * @openapi
 * /api/admin/documents/{documentId}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Review a document and record decision
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Document reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, document]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 document:
 *                   type: object
 *       404:
 *         description: Document not found
 */
router.patch(
	"/documents/:documentId/review",
	AdminSubmissionController.reviewDocument,
);

export default router;
