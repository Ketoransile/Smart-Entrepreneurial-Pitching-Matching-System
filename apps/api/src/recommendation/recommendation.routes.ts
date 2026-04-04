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
import { MatchingService } from "../services/matching.service";
import { applyRocchioUpdate } from "./rocchio.service";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Recommendation
 *     description: AI matching queue and investor match response actions
 */

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
 *       500:
 *         description: Failed to fetch matches
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
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Match not found
 *       500:
 *         description: Failed to update match
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

			res.status(200).json({
				status: "success",
				message: `Match ${status}`,
				match,
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
