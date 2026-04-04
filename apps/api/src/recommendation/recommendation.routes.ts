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

// ── GET /api/recommendation/matches ─────────────────────────────────────────
/**
 * Returns the authenticated investor's AI match queue.
 * Supports optional ?status= filter (pending | accepted | declined | expired).
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
 * Investor responds to a match (accepted | declined).
 *
 * 1. Delegates status update + invitation + notification to MatchingService
 * 2. Fires Rocchio profile update in the background (non-blocking)
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
