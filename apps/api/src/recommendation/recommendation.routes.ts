/**
 * recommendation.routes.ts
 * ------------------------
 * Routes specific to the recommendation feature.
 *
 * PATCH /api/recommendation/matches/:matchId/respond
 *   Investor accepts or declines a match.
 *   After updating MatchResult.status, fires a Rocchio profile update
 *   (fire-and-forget) so the investor's embedding improves over time.
 *
 * GET /api/recommendation/matches
 *   Returns the investor's personalised AI match queue with full
 *   score breakdown (sector / stage / budget / embedding).
 */

import { type Request, type Response, Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { MatchResult } from "../models/MatchResult";
import { Submission } from "../models/Submission";
import { AIService } from "../services/ai.service";
import { MatchingService } from "../services/matching.service";
import { MessageService } from "../services/message.service";
import { applyRocchioUpdate } from "./rocchio.service";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Recommendation
 *     description: AI matching queue and investor match response actions
 */

// ── POST /api/recommendation/classify ────────────────────────────────────────
// Admin-only proxy to the Python /classify-pitch endpoint.
// Keeps the AI service off the public internet — browser calls Node, Node calls Python.
/**
 * @openapi
 * /api/recommendation/classify:
 *   post:
 *     tags: [Recommendation]
 *     summary: Classify a pitch via the AI service
 *     description: Admin-only proxy to the Python /classify-pitch endpoint. Keeps the AI service off the public internet.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pitchText]
 *             properties:
 *               pitchText:
 *                 type: string
 *                 description: The pitch text to classify
 *     responses:
 *       200:
 *         description: Classification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *       400:
 *         description: pitchText is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Classification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/classify",
	authenticate,
	authorize("admin"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { pitchText } = req.body as { pitchText: string };
			if (!pitchText?.trim()) {
				res
					.status(400)
					.json({ status: "error", message: "pitchText is required" });
				return;
			}
			const result = await AIService.classifyPitch(pitchText);
			res.status(200).json({ status: "success", ...result });
		} catch (err) {
			console.error("Failed to classify pitch", err);
			res
				.status(500)
				.json({ status: "error", message: "Classification failed" });
		}
	},
);

// ── GET /api/recommendation/matches/count ────────────────────────────────────
// Returns accepted match count for the authenticated entrepreneur's submissions.
// Used by the entrepreneur dashboard stat card.
/**
 * @openapi
 * /api/recommendation/matches/count:
 *   get:
 *     tags: [Recommendation]
 *     summary: Get accepted match count for entrepreneur
 *     description: Returns the number of accepted matches for the authenticated entrepreneur's submissions.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Match count returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                   example: 3
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/matches/count",
	authenticate,
	authorize("entrepreneur"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const count = await MatchResult.countDocuments({
				entrepreneurId: req.user?._id,
				status: "accepted",
			});
			res.status(200).json({ status: "success", count });
		} catch (err) {
			console.error("Failed to fetch match count", err);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch match count" });
		}
	},
);

// ── POST /api/recommendation/matches/click/:submissionId ─────────────────────
// Records an implicit "click" Rocchio signal (+0.05) when an investor opens
// a pitch detail page. Also returns the match context (score, breakdown,
// status) so the pitch page can display it without a separate fetch.
/**
 * @openapi
 * /api/recommendation/matches/click/{submissionId}:
 *   post:
 *     tags: [Recommendation]
 *     summary: Record click signal on a pitch
 *     description: Records an implicit Rocchio click signal when an investor views a pitch. Returns the match context.
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
 *         description: Click recorded and match context returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 match:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
	"/matches/click/:submissionId",
	authenticate,
	authorize("investor"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const investorUserId = req.user?._id.toString() ?? "";
			const { submissionId } = req.params;

			const match = await MatchResult.findOne({
				submissionId,
				investorId: req.user?._id,
			}).lean();

			if (!match) {
				res.status(200).json({ status: "success", match: null });
				return;
			}

			// Fire Rocchio click update in background — never block the response
			setImmediate(() => {
				applyRocchioUpdate({
					investorUserId,
					submissionId,
					action: "click",
				}).catch(() => {
					// Silently ignore — click signal is best-effort
				});
			});

			res.status(200).json({ status: "success", match });
		} catch (err) {
			console.error("Failed to record click signal", err);
			res
				.status(500)
				.json({ status: "error", message: "Failed to record click" });
		}
	},
);

// ── GET /api/recommendation/matches ─────────────────────────────────────────
/**
 * @openapi
 * /api/recommendation/matches:
 *   get:
 *     tags: [Recommendation]
 *     summary: Get authenticated investor's recommendation matches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, expired]
 *     responses:
 *       200:
 *         description: Matches fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 count:
 *                   type: integer
 *                 matches:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to fetch matches
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/matches",
	authenticate,
	authorize("investor"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const status = req.query.status as
				| "pending"
				| "accepted"
				| "declined"
				| "expired"
				| undefined;

			const matches = await MatchingService.getInvestorMatches({
				investorId: req.user?._id.toString() ?? "",
				status,
			});

			res.status(200).json({
				status: "success",
				count: matches.length,
				matches,
			});
		} catch (err) {
			console.error("Failed to fetch recommendation matches", err);
			res
				.status(500)
				.json({ status: "error", message: "Failed to fetch matches" });
		}
	},
);

// ── PATCH /api/recommendation/matches/:matchId/respond ───────────────────────
/**
 * @openapi
 * /api/recommendation/matches/{matchId}/respond:
 *   patch:
 *     tags: [Recommendation]
 *     summary: Accept or decline a recommendation match
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
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
 *                 enum: [accepted, declined]
 *     responses:
 *       200:
 *         description: Match response recorded
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
 *                 match:
 *                   type: object
 *                 conversationId:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Match not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to update match
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
	"/matches/:matchId/respond",
	authenticate,
	authorize("investor"),
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { status } = req.body as { status: "accepted" | "declined" };

			if (!["accepted", "declined"].includes(status)) {
				res.status(400).json({
					status: "error",
					message: "status must be 'accepted' or 'declined'",
				});
				return;
			}

			const investorUserId = req.user?._id.toString() ?? "";

			// Update match status (handles invitation + notifications)
			const match = await MatchingService.updateMatchStatus({
				matchId: req.params.matchId,
				investorId: investorUserId,
				status,
			});

			// Fire Rocchio update in background — never block the response
			setImmediate(() => {
				applyRocchioUpdate({
					investorUserId,
					submissionId: match.submissionId.toString(),
					action: status,
				}).catch((err) => {
					console.error(
						"Rocchio update failed (non-critical):",
						err?.message ?? err,
					);
				});
			});

			// On accept: create/get conversation and send automatic system message
			let conversationId: string | null = null;
			if (status === "accepted") {
				try {
					const entrepreneurUserId = match.entrepreneurId.toString();
					const conversation = await MessageService.getOrCreateConversation({
						currentUserId: investorUserId,
						otherUserId: entrepreneurUserId,
						matchResultId: match._id.toString(),
						submissionId: match.submissionId.toString(),
					});
					conversationId = conversation._id.toString();

					// Fetch submission title for the system message
					const submission = await Submission.findById(match.submissionId)
						.select("title")
						.lean();
					const pitchTitle = submission?.title ?? "your pitch";

					// Send automatic system message from investor to entrepreneur
					await MessageService.sendMessage({
						conversationId: conversationId,
						senderId: investorUserId,
						body: `👋 Hi! I reviewed your pitch "${pitchTitle}" and I'm interested in learning more. I've accepted the match — let's connect and discuss next steps.`,
						type: "text",
					});
				} catch (err) {
					// Non-critical — don't fail the whole request
					console.error("Failed to create conversation on accept:", err);
				}
			}

			res.status(200).json({
				status: "success",
				message: `Match ${status}`,
				match,
				conversationId,
			});
		} catch (err) {
			if (MatchingService.isServiceError(err)) {
				res
					.status(err.statusCode)
					.json({ status: "error", message: err.message });
				return;
			}
			console.error("Failed to respond to match", err);
			res
				.status(500)
				.json({ status: "error", message: "Failed to update match" });
		}
	},
);

export default router;
