import type { Request, Response } from "express";
import { AdminDocumentService } from "../../services/admin/document.service";
import { AdminSubmissionService } from "../../services/admin/submission.service";

const handleSubmissionAdminError = (
	res: Response,
	error: unknown,
	fallback: string,
) => {
	if (AdminSubmissionService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}
	if (AdminDocumentService.isServiceError(error)) {
		res
			.status(error.statusCode)
			.json({ status: "error", message: error.message });
		return;
	}

	console.error(fallback, error);
	res.status(500).json({ status: "error", message: fallback });
};

export class AdminSubmissionController {
	static async listSubmissions(req: Request, res: Response): Promise<void> {
		try {
			const result = await AdminSubmissionService.listSubmissions({
				page: req.query.page ? Number(req.query.page) : undefined,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
				status: req.query.status as
					| "draft"
					| "submitted"
					| "under_review"
					| "approved"
					| "rejected"
					| "matched"
					| "closed"
					| undefined,
				sector: req.query.sector as string | undefined,
				entrepreneurId: req.query.entrepreneurId as string | undefined,
			});

			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			handleSubmissionAdminError(res, error, "Failed to list submissions");
		}
	}

	static async reviewSubmission(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const decision = req.body.decision as "approve" | "reject";
			if (!["approve", "reject"].includes(decision)) {
				res.status(400).json({
					status: "error",
					message: "Decision must be approve or reject",
				});
				return;
			}

			const submission = await AdminSubmissionService.reviewSubmission({
				adminId: req.user._id.toString(),
				submissionId: req.params.submissionId,
				decision,
				notes: req.body.notes,
				isAiOverride: req.body.isAiOverride,
				overrideReason: req.body.overrideReason,
			});

			res.status(200).json({ status: "success", submission });
		} catch (error) {
			handleSubmissionAdminError(res, error, "Failed to review submission");
		}
	}

	static async forceCloseSubmission(
		req: Request,
		res: Response,
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const submission = await AdminSubmissionService.forceCloseSubmission({
				adminId: req.user._id.toString(),
				submissionId: req.params.submissionId,
				reason: req.body.reason,
			});

			res.status(200).json({ status: "success", submission });
		} catch (error) {
			handleSubmissionAdminError(res, error, "Failed to close submission");
		}
	}

	static async listDocuments(req: Request, res: Response): Promise<void> {
		try {
			const result = await AdminDocumentService.listDocuments({
				page: req.query.page ? Number(req.query.page) : undefined,
				limit: req.query.limit ? Number(req.query.limit) : undefined,
				status: req.query.status as
					| "uploaded"
					| "processing"
					| "processed"
					| "failed"
					| undefined,
				type: req.query.type as
					| "pitch_deck"
					| "financial_model"
					| "legal"
					| "other"
					| undefined,
			});
			res.status(200).json({ status: "success", ...result });
		} catch (error) {
			handleSubmissionAdminError(res, error, "Failed to list documents");
		}
	}

	static async reviewDocument(req: Request, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({ status: "error", message: "Unauthorized" });
				return;
			}

			const status = req.body.status as "processed" | "failed";
			if (!["processed", "failed"].includes(status)) {
				res
					.status(400)
					.json({ status: "error", message: "Invalid review status" });
				return;
			}

			const document = await AdminDocumentService.reviewDocument({
				adminId: req.user._id.toString(),
				documentId: req.params.documentId,
				status,
				reason: req.body.reason,
			});

			res.status(200).json({ status: "success", document });
		} catch (error) {
			handleSubmissionAdminError(res, error, "Failed to review document");
		}
	}
}
