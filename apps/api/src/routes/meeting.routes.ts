import { Router } from "express";
import { MeetingController } from "../controllers/meeting.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/meetings:
 *   post:
 *     tags: [Communication]
 *     summary: Schedule a meeting
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduledAt, participants]
 *             properties:
 *               title:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               durationMinutes:
 *                 type: integer
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               submissionId:
 *                 type: string
 *               meetingUrl:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, meeting]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 meeting:
 *                   type: object
 */
router.post("/", authenticate, MeetingController.schedule);

/**
 * @openapi
 * /api/meetings:
 *   get:
 *     tags: [Communication]
 *     summary: List my meetings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, ongoing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Meetings fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, count, meetings]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 count: { type: integer }
 *                 meetings:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", authenticate, MeetingController.listMine);

/**
 * @openapi
 * /api/meetings/{meetingId}/status:
 *   patch:
 *     tags: [Communication]
 *     summary: Update meeting status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
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
 *                 enum: [scheduled, ongoing, completed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Meeting updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, meeting]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 meeting:
 *                   type: object
 */
router.patch(
	"/:meetingId/status",
	authenticate,
	MeetingController.updateStatus,
);

/**
 * @openapi
 * /api/meetings/{meetingId}/token:
 *   get:
 *     tags: [Communication]
 *     summary: Get a LiveKit access token for a meeting
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: LiveKit JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, token]
 *               properties:
 *                 status: { type: string, enum: [success] }
 *                 token:
 *                   type: string
 */
router.get("/:meetingId/token", authenticate, MeetingController.getToken);

export default router;
