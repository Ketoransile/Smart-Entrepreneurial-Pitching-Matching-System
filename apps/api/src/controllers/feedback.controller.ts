import type { Request, Response } from "express";
import { FeedbackService } from "../services/feedback.service";

const handleFeedbackError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (FeedbackService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class FeedbackController {
	static async create(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const feedback = await FeedbackService.createFeedback({
				fromUserId: req.user._id.toString(),
				toUserId: req.body.toUserId,
				rating: Number(req.body.rating),
				category: req.body.category,
				comment: req.body.comment,
				invitationId: req.body.invitationId,
				matchResultId: req.body.matchResultId,
				submissionId: req.body.submissionId,
			});

			res.status(201).json({ status: "success", feedback });
		} catch (error) {
			handleFeedbackError(res, error, "Failed to submit feedback");
		}
	}

	static async listReceived(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const feedback = await FeedbackService.listReceivedFeedback(
				req.user._id.toString(),
			);

			res
				.status(200)
				.json({ status: "success", count: feedback.length, feedback });
		} catch (error) {
			handleFeedbackError(res, error, "Failed to fetch received feedback");
		}
	}

	static async listGiven(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const feedback = await FeedbackService.listGivenFeedback(
				req.user._id.toString(),
			);

			res
				.status(200)
				.json({ status: "success", count: feedback.length, feedback });
		} catch (error) {
			handleFeedbackError(res, error, "Failed to fetch submitted feedback");
		}
	}

	static async mySummary(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const summary = await FeedbackService.getFeedbackSummary(
				req.user._id.toString(),
			);
			res.status(200).json({ status: "success", summary });
		} catch (error) {
			handleFeedbackError(res, error, "Failed to fetch feedback summary");
		}
	}

	static async userSummary(req: Request, res: Response): Promise<void> {
		try {
			const summary = await FeedbackService.getFeedbackSummary(
				req.params.userId,
			);
			res.status(200).json({ status: "success", summary });
		} catch (error) {
			handleFeedbackError(res, error, "Failed to fetch user feedback summary");
		}
	}
}
