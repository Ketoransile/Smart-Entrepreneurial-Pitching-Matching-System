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
 *               matchResultId:
 *                 type: string
 *               submissionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, conversation]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 conversation:
 *                   type: object
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
 *               type: object
 *               required: [status, count, conversations]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 conversations:
 *                   type: array
 *                   items:
 *                     type: object
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
 *               type: object
 *               required: [status, conversation]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 conversation:
 *                   type: object
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
 *               type: object
 *               required: [status, count, total, page, totalPages, messages]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
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
 *             properties:
 *               body:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, file]
 *               attachmentUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, data]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: Message sent }
 *                 data:
 *                   type: object
 */
router.post(
	"/conversations/:conversationId/messages",
	authenticate,
	MessageController.sendMessage,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/participants:
 *   post:
 *     tags: [Communication]
 *     summary: Admin add participant to a conversation
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
 *             required: [targetUserId]
 *             properties:
 *               targetUserId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, data]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: Participant added }
 *                 data:
 *                   type: object
 */
router.post(
	"/conversations/:conversationId/participants",
	authenticate,
	authorize("admin", "super_admin"),
	MessageController.addParticipant,
);

/**
 * @openapi
 * /api/messages/conversations/{conversationId}/participants/{userId}:
 *   delete:
 *     tags: [Communication]
 *     summary: Admin remove participant from a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, data]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string, example: Participant removed }
 *                 data:
 *                   type: object
 */
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
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: Conversation marked as read
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
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report created, conversation frozen, and admins alerted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: Conversation frozen and admin alerted
 *                 report:
 *                   type: object
 *                 conversation:
 *                   type: object
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
 *               type: object
 *               required: [status, unreadCount]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 unreadCount: { type: integer }
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
 *               type: object
 *               required: [status, count, notifications]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/notifications", authenticate, MessageController.listNotifications);

/**
 * @openapi
 * /api/messages/notifications/read-all:
 *   patch:
 *     tags: [Communication]
 *     summary: Mark all unread notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 */
router.patch(
	"/notifications/read-all",
	authenticate,
	MessageController.markAllNotificationsRead,
);

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
 *               type: object
 *               required: [status, notification]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 notification:
 *                   type: object
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
 *               type: object
 *               required: [status, count, reports]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 reports:
 *                   type: array
 *                   items:
 *                     type: object
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
 *     responses:
 *       200:
 *         description: Report resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, report]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 message: { type: string }
 *                 report:
 *                   type: object
 */
router.patch(
	"/admin/reports/:reportId/resolve",
	authenticate,
	authorize("admin"),
	MessageController.resolveReport,
);

export default router;
