import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Feedback
 *     description: Post-invitation relationship feedback
 */

/**
 * @openapi
 * /api/feedback:
 *   post:
 *     tags: [Feedback]
 *     summary: Submit feedback for another user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [toUserId, rating]
 *             properties:
 *               toUserId:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               category:
 *                 type: string
 *                 enum: [overall, communication, professionalism, pitch_quality, collaboration]
 *               comment:
 *                 type: string
 *               invitationId:
 *                 type: string
 *               matchResultId:
 *                 type: string
 *               submissionId:
 *                 type: string
 *           example:
 *             toUserId: "65f2c3dcb295a9b0ff123456"
 *             rating: 5
 *             category: "communication"
 *             comment: "Fast responses and very constructive follow-ups."
 *             invitationId: "65f2c7f0b295a9b0ff654321"
 *     responses:
 *       201:
 *         description: Feedback created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     feedback:
 *                       $ref: '#/components/schemas/FeedbackObject'
 *       400:
 *         description: Validation error
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
router.post("/", authenticate, FeedbackController.create);

/**
 * @openapi
 * /api/feedback/me/received:
 *   get:
 *     tags: [Feedback]
 *     summary: List feedback I have received
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received feedback list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     feedback:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeedbackObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me/received", authenticate, FeedbackController.listReceived);

/**
 * @openapi
 * /api/feedback/me/given:
 *   get:
 *     tags: [Feedback]
 *     summary: List feedback I have submitted
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Given feedback list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     feedback:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FeedbackObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me/given", authenticate, FeedbackController.listGiven);

/**
 * @openapi
 * /api/feedback/me/summary:
 *   get:
 *     tags: [Feedback]
 *     summary: Get summary statistics for my received feedback
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feedback summary returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     summary:
 *                       $ref: '#/components/schemas/FeedbackSummary'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me/summary", authenticate, FeedbackController.mySummary);

/**
 * @openapi
 * /api/feedback/users/{userId}/summary:
 *   get:
 *     tags: [Feedback]
 *     summary: Get public feedback summary for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Feedback summary returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     summary:
 *                       $ref: '#/components/schemas/FeedbackSummary'
 */
router.get("/users/:userId/summary", FeedbackController.userSummary);

export default router;
