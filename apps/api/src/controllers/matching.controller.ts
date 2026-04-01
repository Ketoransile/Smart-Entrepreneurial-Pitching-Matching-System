import type { Request, Response } from "express";
import { MatchingService } from "../services/matching.service";

const handleMatchingError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (MatchingService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class MatchingController {
	static async runForSubmission(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const { submissionId } = req.params;
			const limit = req.body?.limit ? Number(req.body.limit) : undefined;
			const minScore = req.body?.minScore
				? Number(req.body.minScore)
				: undefined;

			const result = await MatchingService.runMatchingForSubmission(
				submissionId,
				{
					limit,
					minScore,
				},
			);

			res.status(200).json({
				status: "success",
				message: "Matching completed",
				result,
			});
		} catch (error) {
			handleMatchingError(res, error, "Failed to run matching");
		}
	}

	static async getSubmissionMatches(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const matches = await MatchingService.getSubmissionMatches(
				req.params.submissionId,
				req.user,
			);

			res.status(200).json({
				status: "success",
				count: matches.length,
				matches,
			});
		} catch (error) {
			handleMatchingError(res, error, "Failed to fetch submission matches");
		}
	}

	static async getInvestorMatches(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.query.status as
				| "pending"
				| "accepted"
				| "declined"
				| "expired"
				| undefined;
			const matches = await MatchingService.getInvestorMatches({
				investorId: req.user._id.toString(),
				status,
			});

			res.status(200).json({
				status: "success",
				count: matches.length,
				matches,
			});
		} catch (error) {
			handleMatchingError(res, error, "Failed to fetch investor matches");
		}
	}

	static async updateInvestorMatchStatus(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.body?.status as "accepted" | "declined";
			if (!["accepted", "declined"].includes(status)) {
				res.status(400).json({
					status: "error",
					message: "Status must be either accepted or declined",
				});
				return;
			}

			const match = await MatchingService.updateMatchStatus({
				matchId: req.params.matchId,
				investorId: req.user._id.toString(),
				status,
			});

			res.status(200).json({
				status: "success",
				message: "Match status updated",
				match,
			});
		} catch (error) {
			handleMatchingError(res, error, "Failed to update match status");
		}
	}
}
