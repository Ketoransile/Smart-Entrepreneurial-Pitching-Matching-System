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
 */
router.get("/users/:userId", AdminUserController.getUser);

/**
 * GET /api/admin/users/:userId/profile
 * Admin view of a specific user's complete profile and KYC data
 */
router.get("/users/:userId/profile", AdminUserController.getUser);

router.patch("/users/:userId/status", AdminUserController.updateUserStatus);
router.patch("/users/:userId/active", AdminUserController.setUserActive);

router.get("/submissions", AdminSubmissionController.listSubmissions);
router.patch(
	"/submissions/:submissionId/review",
	AdminSubmissionController.reviewSubmission,
);
router.patch(
	"/submissions/:submissionId/close",
	AdminSubmissionController.forceCloseSubmission,
);

router.get("/documents", AdminSubmissionController.listDocuments);
router.patch(
	"/documents/:documentId/review",
	AdminSubmissionController.reviewDocument,
);

export default router;
