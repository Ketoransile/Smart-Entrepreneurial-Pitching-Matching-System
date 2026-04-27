import { Router } from "express";
import { MessageController } from "../controllers/message.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Communication
 *     description: Conversations, messaging, and notifications
 */

/**
 * @openapi
 * /api/messages/conversations:
 *   post:
 *     tags: [Communication]
 *     summary: Create or get a conversation with another user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otherUserId]
 *             properties:
 *               otherUserId:
 *                 type: string
 *                 description: The MongoDB ID of the other participant
 *               matchResultId:
 *                 type: string
 *                 description: Optional match result to link to the conversation
 *               submissionId:
 *                 type: string
 *                 description: Optional submission to link to the conversation
 *     responses:
 *       200:
 *         description: Conversation returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/conversations",
	authenticate,
	MessageController.getOrCreateConversation,
);

/**
 * @openapi
 * /api/messages/conversations:
 *   get:
 *     tags: [Communication]
 *     summary: List my conversations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     conversations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ConversationObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/conversations", authenticate, MessageController.listConversations);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}:
 *   get:
 *     tags: [Communication]
 *     summary: Get a specific conversation by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     conversation:
 *                       $ref: '#/components/schemas/ConversationObject'
 *       404:
 *         description: Conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/conversations/:conversationId",
	authenticate,
	MessageController.getConversation,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/messages:
 *   get:
 *     tags: [Communication]
 *     summary: List messages in a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
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
 *         description: Messages fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MessageObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/conversations/:conversationId/messages",
	authenticate,
	MessageController.listMessages,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/messages:
 *   post:
 *     tags: [Communication]
 *     summary: Send message to a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 description: Message text content
 *                 example: "Hello, let's discuss the pitch."
 *               type:
 *                 type: string
 *                 enum: [text, file]
 *                 default: text
 *               attachmentUrl:
 *                 type: string
 *                 description: URL to an attached file (when type is file)
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       $ref: '#/components/schemas/MessageObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/conversations/:conversationId/messages",
	authenticate,
	MessageController.sendMessage,
);

router.post(
	"/conversations/:conversationId/participants",
	authenticate,
	authorize("admin", "super_admin"),
	MessageController.addParticipant,
);

router.delete(
	"/conversations/:conversationId/participants/:userId",
	authenticate,
	authorize("admin", "super_admin"),
	MessageController.removeParticipant,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/read:
 *   post:
 *     tags: [Communication]
 *     summary: Mark conversation messages as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
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
router.post(
	"/conversations/:conversationId/read",
	authenticate,
	MessageController.markConversationRead,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/report:
 *   post:
 *     tags: [Communication]
 *     summary: Report misconduct and freeze the conversation pending admin review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Short description of the misconduct
 *               details:
 *                 type: string
 *                 description: Additional details about the report
 *     responses:
 *       201:
 *         description: Report created, conversation frozen, and admins alerted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/MisconductReportObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/conversations/:conversationId/report",
	authenticate,
	MessageController.reportMisconduct,
);

/**
 * @openapi
 * /api/messages/unread-count:
 *   get:
 *     tags: [Communication]
 *     summary: Get total unread message count for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     unreadCount:
 *                       type: integer
 *                       example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/unread-count", authenticate, MessageController.getUnreadCount);

/**
 * @openapi
 * /api/messages/notifications:
 *   get:
 *     tags: [Communication]
 *     summary: List my notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NotificationObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/notifications", authenticate, MessageController.listNotifications);

/**
 * @openapi
 * /api/messages/notifications/{notificationId}/read:
 *   patch:
 *     tags: [Communication]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification updated
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
router.patch(
	"/notifications/:notificationId/read",
	authenticate,
	MessageController.markNotificationRead,
);

/**
 * @openapi
 * /api/messages/admin/reports:
 *   get:
 *     tags: [Communication]
 *     summary: Admin list all misconduct reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, open, resolved]
 *     responses:
 *       200:
 *         description: Reports fetched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MisconductReportObject'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/admin/reports",
	authenticate,
	authorize("admin"),
	MessageController.listReports,
);

/**
 * @openapi
 * /api/messages/admin/reports/{reportId}/resolve:
 *   patch:
 *     tags: [Communication]
 *     summary: Admin resolve a misconduct report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [unfreeze, keep_frozen]
 *                 description: Whether to unfreeze or keep the conversation frozen
 *     responses:
 *       200:
 *         description: Report resolved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/MisconductReportObject'
 *       404:
 *         description: Report not found
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
	"/admin/reports/:reportId/resolve",
	authenticate,
	authorize("admin"),
	MessageController.resolveReport,
);

export default router;
