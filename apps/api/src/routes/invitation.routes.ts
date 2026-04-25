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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 invitation:
 *                   type: object
 *       400:
 *         description: Invalid request
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
 *     responses:
 *       200:
 *         description: Invitations fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 invitations:
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
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *       404:
 *         description: Invitation not found
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
	"/:invitationId/cancel",
	authenticate,
	InvitationController.cancel,
);

export default router;
