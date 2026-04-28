import { Router } from "express";
import { InvitationController } from "../controllers/invitation.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Invitations
 *     description: Formal connection invitations between matched users
 */

/**
 * @openapi
 * /api/invitations:
 *   post:
 *     tags: [Invitations]
 *     summary: Send invitation for an accepted match
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [matchId]
 *             properties:
 *               matchId:
 *                 type: string
 *               message:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 30
 *           example:
 *             matchId: "65f2c7f0b295a9b0ff654321"
 *             message: "Thanks for accepting. Would you like a 20-minute call this week?"
 *             expiresInDays: 10
 *     responses:
 *       201:
 *         description: Invitation created
 */
router.post("/", authenticate, InvitationController.send);

/**
 * @openapi
 * /api/invitations/me:
 *   get:
 *     tags: [Invitations]
 *     summary: List my invitations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled, expired]
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [sent, received, all]
 */
router.get("/me", authenticate, InvitationController.listMine);

/**
 * @openapi
 * /api/invitations/{invitationId}/respond:
 *   patch:
 *     tags: [Invitations]
 *     summary: Accept or decline invitation
 *     security:
 *       - bearerAuth: []
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
 *               responseMessage:
 *                 type: string
 *           example:
 *             status: "accepted"
 *             responseMessage: "Accepted. Let's align on a time tomorrow."
 */
router.patch(
	"/:invitationId/respond",
	authenticate,
	InvitationController.respond,
);

/**
 * @openapi
 * /api/invitations/{invitationId}/cancel:
 *   patch:
 *     tags: [Invitations]
 *     summary: Cancel a pending invitation
 *     security:
 *       - bearerAuth: []
 */
router.patch(
	"/:invitationId/cancel",
	authenticate,
	InvitationController.cancel,
);

export default router;
