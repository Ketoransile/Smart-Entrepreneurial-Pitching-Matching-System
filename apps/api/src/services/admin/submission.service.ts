import { AdminAction } from "../../models/AdminAction";
import { Submission } from "../../models/Submission";
import { normalizePagination } from "./user.service";

class AdminSubmissionServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "AdminSubmissionServiceError";
		this.statusCode = statusCode;
	}
}

export const reviewDecisionToStatus = (decision: "approve" | "reject") => {
	return decision === "approve" ? "approved" : "rejected";
};

export const AdminSubmissionService = {
	createError(message: string, statusCode: number) {
		return new AdminSubmissionServiceError(message, statusCode);
	},

	isServiceError(error: unknown): error is AdminSubmissionServiceError {
		return error instanceof AdminSubmissionServiceError;
	},

	async listSubmissions(payload: {
		page?: number;
		limit?: number;
		status?:
			| "draft"
			| "submitted"
			| "under_review"
			| "approved"
			| "rejected"
			| "matched"
			| "closed";
		sector?: string;
		entrepreneurId?: string;
	}) {
		const { page, limit, skip } = normalizePagination(
			payload.page,
			payload.limit,
		);
		const filter: Record<string, unknown> = {};
		if (payload.status) {
			filter.status = payload.status;
		}
		if (payload.sector) {
			filter.sector = payload.sector;
		}
		if (payload.entrepreneurId) {
			filter.entrepreneurId = payload.entrepreneurId;
		}

		const [submissions, total] = await Promise.all([
			Submission.find(filter)
				.sort({ updatedAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("entrepreneurId", "fullName email"),
			Submission.countDocuments(filter),
		]);

		return {
			submissions,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	},

	async reviewSubmission(payload: {
		adminId: string;
		submissionId: string;
		decision: "approve" | "reject";
		notes?: string;
		isAiOverride?: boolean;
		overrideReason?: string;
	}) {
		const submission = await Submission.findById(payload.submissionId);
		if (!submission) {
			throw AdminSubmissionService.createError("Submission not found", 404);
		}

		const nextStatus = reviewDecisionToStatus(payload.decision);
		const previousStatus = submission.status;
		submission.status = nextStatus;
		submission.reviewNotes = payload.notes || undefined;
		if (payload.isAiOverride !== undefined) {
			submission.isAiOverride = payload.isAiOverride;
		}
		if (payload.overrideReason) {
			submission.aiOverrideReason = payload.overrideReason;
		}
		if (nextStatus === "approved") {
			submission.submittedAt = submission.submittedAt || new Date();
		}
		await submission.save();

		await AdminAction.create({
			adminId: payload.adminId,
			action:
				nextStatus === "approved" ? "approve_submission" : "reject_submission",
			targetId: submission._id,
			targetType: "submission",
			reason: payload.overrideReason || payload.notes || null,
			metadata: {
				previousStatus,
				nextStatus,
				isAiOverride: payload.isAiOverride,
				aiOverrideReason: payload.overrideReason,
			},
		});

		return submission;
	},

	async forceCloseSubmission(payload: {
		adminId: string;
		submissionId: string;
		reason?: string;
	}) {
		const submission = await Submission.findById(payload.submissionId);
		if (!submission) {
			throw AdminSubmissionService.createError("Submission not found", 404);
		}

		const previousStatus = submission.status;
		submission.status = "closed";
		submission.closedAt = new Date();
		submission.reviewNotes =
			payload.reason || submission.reviewNotes || undefined;
		await submission.save();

		await AdminAction.create({
			adminId: payload.adminId,
			action: "force_close_submission",
			targetId: submission._id,
			targetType: "submission",
			reason: payload.reason || null,
			metadata: {
				previousStatus,
				nextStatus: "closed",
			},
		});

		return submission;
	},
};
