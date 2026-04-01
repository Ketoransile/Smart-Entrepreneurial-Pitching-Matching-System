import type { Request, Response } from "express";
import { DocumentValidationService } from "../services/document-validation.service";
import { SubmissionService } from "../services/submission.service";
import { enqueueSubmissionAnalysis } from "../workers/ai.processor";

const handleSubmissionError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (SubmissionService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class SubmissionController {
	static async createDraft(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submission = await SubmissionService.createDraft({
				entrepreneurId: req.user._id.toString(),
				userStatus: req.user.status,
				title: req.body.title,
				sector: req.body.sector,
				stage: req.body.stage,
			});

			res
				.status(201)
				.json({ status: "success", message: "Draft created", submission });
		} catch (error) {
			handleSubmissionError(res, error, "Failed to create submission");
		}
	}

	static async listMine(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submissions = await SubmissionService.listMine(
				req.user._id.toString(),
			);
			res
				.status(200)
				.json({ status: "success", count: submissions.length, submissions });
		} catch (error) {
			handleSubmissionError(res, error, "Failed to fetch submissions");
		}
	}

	static async getOne(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submission = await SubmissionService.getOneForUser(
				req.params.id,
				req.user,
			);
			res.status(200).json({ status: "success", submission });
		} catch (error) {
			handleSubmissionError(res, error, "Failed to fetch submission");
		}
	}

	static async updateDraft(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submission = await SubmissionService.updateDraft({
				submissionId: req.params.id,
				entrepreneurId: req.user._id.toString(),
				updates: req.body,
			});

			res
				.status(200)
				.json({ status: "success", message: "Draft saved", submission });
		} catch (error) {
			handleSubmissionError(res, error, "Failed to update submission");
		}
	}

	static async submit(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submission = await SubmissionService.submitDraft({
				submissionId: req.params.id,
				entrepreneurId: req.user._id.toString(),
			});

			res.status(200).json({
				status: "success",
				message: "Pitch submitted for AI review",
				submission,
			});

			enqueueSubmissionAnalysis(submission._id.toString());
		} catch (error) {
			if (
				SubmissionService.isServiceError(error) &&
				error.statusCode === 400 &&
				error.message.startsWith("Incomplete submission:")
			) {
				res.status(400).json({
					status: "error",
					message: "Incomplete submission",
					errors: error.message
						.replace("Incomplete submission: ", "")
						.split("; "),
				});
				return;
			}

			handleSubmissionError(res, error, "Failed to submit pitch");
		}
	}

	/**
	 * UC-05 Step 8: AI Completeness Checker endpoint.
	 * Returns the document completeness score, full checklist,
	 * and list of missing required documents.
	 */
	static async getCompleteness(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			// Verify the user owns this submission
			await SubmissionService.getOneForUser(req.params.id, req.user);

			const completeness = await DocumentValidationService.checkCompleteness(
				req.params.id,
			);

			res.status(200).json({
				status: "success",
				completeness,
			});
		} catch (error) {
			handleSubmissionError(
				res,
				error,
				"Failed to check document completeness",
			);
		}
	}

	static async removeDraft(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			await SubmissionService.deleteDraft({
				submissionId: req.params.id,
				entrepreneurId: req.user._id.toString(),
			});

			res.status(200).json({ status: "success", message: "Draft deleted" });
		} catch (error) {
			handleSubmissionError(res, error, "Failed to delete submission");
		}
	}

	static async browseFeed(req: Request, res: Response): Promise<void> {
		try {
			const result = await SubmissionService.browseFeed(
				req.query as Record<string, unknown>,
			);

			res.status(200).json({
				status: "success",
				count: result.submissions.length,
				total: result.total,
				page: result.page,
				totalPages: result.totalPages,
				submissions: result.submissions,
			});
		} catch (error) {
			handleSubmissionError(res, error, "Failed to fetch feed");
		}
	}

	static async listAdmin(req: Request, res: Response): Promise<void> {
		try {
			const result = await SubmissionService.listAdmin(
				req.query as Record<string, unknown>,
			);

			res.status(200).json({
				status: "success",
				count: result.submissions.length,
				total: result.total,
				page: result.page,
				totalPages: result.totalPages,
				submissions: result.submissions,
				stats: result.stats,
			});
		} catch (error) {
			handleSubmissionError(res, error, "Failed to fetch submissions");
		}
	}

	static async updateStatusAdmin(req: Request, res: Response): Promise<void> {
		try {
			const { status, reason } = req.body;
			const validStatuses = ["approved", "rejected", "suspended"];
			if (!validStatuses.includes(status)) {
				res
					.status(400)
					.json({ status: "error", message: "Invalid status value provided" });
				return;
			}

			// Service call (we'll implement this directly in the controller or pass to service)
			// Wait, SubmissionService might not have an updateStatus method. Let's just do it here or call a service method.
			// Ideally we use a service method, but `SubmissionService.updateStatus` doesn't exist yet.
			// Let's call SubmissionService.updateAdminStatus
			const result = await SubmissionService.updateAdminStatus(
				req.params.id,
				status,
				reason,
			);

			res.status(200).json({
				status: "success",
				message: `Submission status successfully updated to ${status}`,
				submission: result,
			});
		} catch (error) {
			handleSubmissionError(res, error, "Failed to update submission status");
		}
	}
}
