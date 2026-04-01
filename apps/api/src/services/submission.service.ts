import { DocumentModel } from "../models/Document";
import { type ISubmission, Submission } from "../models/Submission";
import type { IUser } from "../models/User";
import { DocumentValidationService } from "./document-validation.service";

class SubmissionServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "SubmissionServiceError";
		this.statusCode = statusCode;
	}
}

const parseIntOrDefault = (value: unknown, fallback: number): number => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	return Number.isNaN(parsed) ? fallback : parsed;
};

const hasMinLength = (value: unknown, min: number): boolean =>
	typeof value === "string" && value.trim().length >= min;

export class SubmissionService {
	static createError(
		message: string,
		statusCode: number,
	): SubmissionServiceError {
		return new SubmissionServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is SubmissionServiceError {
		return error instanceof SubmissionServiceError;
	}

	static async createDraft(payload: {
		entrepreneurId: string;
		userStatus: IUser["status"];
		title?: string;
		sector?: string;
		stage?: string;
	}): Promise<ISubmission> {
		if (payload.userStatus !== "verified") {
			throw SubmissionService.createError(
				"Your account must be verified before you can create pitches. Please complete your KYC verification first.",
				403,
			);
		}

		return Submission.create({
			entrepreneurId: payload.entrepreneurId,
			title: payload.title || "Untitled Pitch",
			sector: payload.sector || "other",
			stage: payload.stage || "idea",
			status: "draft",
			currentStep: 1,
		});
	}

	static async listMine(entrepreneurId: string): Promise<ISubmission[]> {
		return Submission.find({ entrepreneurId }).sort({ updatedAt: -1 });
	}

	static async getOneForUser(
		submissionId: string,
		user: IUser,
	): Promise<ISubmission> {
		const submission = await Submission.findById(submissionId).populate("entrepreneurId", "fullName email");

		if (!submission) {
			throw SubmissionService.createError("Submission not found", 404);
		}

		// After .populate(), entrepreneurId is a hydrated object { _id, fullName, email }.
		// Extract the raw _id for comparison.
		const ownerId =
			typeof submission.entrepreneurId === "object" && submission.entrepreneurId !== null
				? (submission.entrepreneurId as any)._id?.toString() || (submission.entrepreneurId as any).toString()
				: (submission.entrepreneurId as any)?.toString();

		if (user.role === "entrepreneur" && ownerId !== user._id.toString()) {
			throw SubmissionService.createError("Access denied", 403);
		}

		// Don't let investors snoop on incomplete or suspended pitches
		if (user.role === "investor" && submission.status !== "approved" && submission.status !== "matched") {
			throw SubmissionService.createError("Pitch is not publicly available yet", 403);
		}

		return submission;
	}

	static async updateDraft(payload: {
		submissionId: string;
		entrepreneurId: string;
		updates: Record<string, unknown>;
	}): Promise<ISubmission> {
		const submission = await Submission.findOne({
			_id: payload.submissionId,
			entrepreneurId: payload.entrepreneurId,
		});

		if (!submission) {
			throw SubmissionService.createError("Submission not found", 404);
		}

		if (submission.status !== "draft") {
			throw SubmissionService.createError(
				"Cannot edit a submitted pitch.",
				400,
			);
		}

		const allowedFields = [
			"title",
			"problem",
			"solution",
			"businessModel",
			"financials",
			"sector",
			"stage",
			"targetAmount",
			"summary",
			"currentStep",
			"documents",
			"currency",
		] as const;

		for (const field of allowedFields) {
			if (payload.updates[field] !== undefined) {
				submission.set(field, payload.updates[field]);
			}
		}

		await submission.save();
		return submission;
	}

	static async submitDraft(payload: {
		submissionId: string;
		entrepreneurId: string;
	}): Promise<ISubmission> {
		const submission = await Submission.findOne({
			_id: payload.submissionId,
			entrepreneurId: payload.entrepreneurId,
		});

		if (!submission) {
			throw SubmissionService.createError("Submission not found", 404);
		}

		if (submission.status !== "draft") {
			throw SubmissionService.createError(
				"This pitch has already been submitted.",
				400,
			);
		}

		// ── Comprehensive pre-submission validation ──
		const errors: string[] = [];

		// Overview fields
		if (!submission.title || submission.title === "Untitled Pitch") {
			errors.push("Title is required");
		}
		if (!hasMinLength(submission.summary, 20)) {
			errors.push("Executive summary is required (min 20 characters)");
		}
		if (!submission.targetAmount || submission.targetAmount <= 0) {
			errors.push("Target funding amount is required");
		}

		// Problem section
		if (!hasMinLength(submission.problem?.statement, 20)) {
			errors.push("Problem statement is required (min 20 characters)");
		}
		if (!hasMinLength(submission.problem?.targetMarket, 10)) {
			errors.push("Target market description is required");
		}
		if (!hasMinLength(submission.problem?.marketSize, 5)) {
			errors.push("Market size is required");
		}

		// Solution section
		if (!hasMinLength(submission.solution?.description, 20)) {
			errors.push("Solution description is required (min 20 characters)");
		}
		if (!hasMinLength(submission.solution?.uniqueValue, 10)) {
			errors.push("Unique value proposition is required");
		}
		if (!hasMinLength(submission.solution?.competitiveAdvantage, 10)) {
			errors.push("Competitive advantage is required");
		}

		// Business model section
		if (!hasMinLength(submission.businessModel?.revenueStreams, 10)) {
			errors.push("Revenue streams are required");
		}
		if (!hasMinLength(submission.businessModel?.pricingStrategy, 10)) {
			errors.push("Pricing strategy is required");
		}
		if (!hasMinLength(submission.businessModel?.customerAcquisition, 10)) {
			errors.push("Customer acquisition strategy is required");
		}

		// Financials section
		if (!hasMinLength(submission.financials?.projectedRevenue, 5)) {
			errors.push("Projected revenue is required");
		}

		// ── Document completeness check (UC-05 step 8) ──
		const completeness = await DocumentValidationService.checkCompleteness(
			submission._id.toString(),
		);

		if (!completeness.complete) {
			completeness.missingRequired.forEach((missingDoc) => {
				errors.push(`${missingDoc} missing`);
			});
		}

		// Check for documents still processing, failed, or flagged
		const processingDocs = completeness.checklist.filter(
			(c) => c.status === "processing",
		);
		const failedDocs = completeness.checklist.filter(
			(c) => c.status === "failed",
		);
		const flaggedDocs = completeness.checklist.filter(
			(c) => c.status === "flagged",
		);

		if (processingDocs.length > 0) {
			errors.push(
				`Documents still processing: ${processingDocs.map((d) => d.label).join(", ")}`,
			);
		}
		if (failedDocs.length > 0) {
			errors.push(
				`Documents failed validation: ${failedDocs.map((d) => d.label).join(", ")}`,
			);
		}
		if (flaggedDocs.length > 0) {
			errors.push(
				`Documents marked as suspicious: ${flaggedDocs.map((d) => d.label).join(", ")}. Administrator review required.`,
			);
		}

		if (errors.length > 0) {
			throw SubmissionService.createError(
				`Incomplete submission: ${errors.join("; ")}`,
				400,
			);
		}

		submission.status = "submitted";
		submission.submittedAt = new Date();
		await submission.save();

		return submission;
	}

	static async deleteDraft(payload: {
		submissionId: string;
		entrepreneurId: string;
	}): Promise<void> {
		const deleted = await Submission.findOneAndDelete({
			_id: payload.submissionId,
			entrepreneurId: payload.entrepreneurId,
			status: "draft",
		});

		if (!deleted) {
			throw SubmissionService.createError(
				"Draft not found or already submitted",
				404,
			);
		}
	}

	static async browseFeed(query: Record<string, unknown>) {
		const { sector, sort, page = "1", limit = "12" } = query;
		const safePage = Math.max(parseIntOrDefault(page, 1), 1);
		const safeLimit = Math.min(Math.max(parseIntOrDefault(limit, 12), 1), 100);

		const filter: Record<string, unknown> = {
			status: "approved",
		};

		if (sector && sector !== "all") {
			filter.sector = sector;
		}

		let sortOption: Record<string, 1 | -1> = { submittedAt: -1 };
		if (sort === "score") sortOption = { aiScore: -1 };
		if (sort === "amount_high") sortOption = { targetAmount: -1 };
		if (sort === "amount_low") sortOption = { targetAmount: 1 };

		const skip = (safePage - 1) * safeLimit;
		const total = await Submission.countDocuments(filter);
		const submissions = await Submission.find(filter)
			.select(
				"title summary sector targetAmount stage status aiScore submittedAt updatedAt",
			)
			.sort(sortOption)
			.skip(skip)
			.limit(safeLimit);

		return {
			submissions,
			total,
			page: safePage,
			totalPages: Math.ceil(total / safeLimit),
		};
	}

	static async listAdmin(query: Record<string, unknown>) {
		const { status: statusFilter, sector: sectorFilter, page = "1", limit = "20" } = query;
		const safePage = Math.max(parseIntOrDefault(page, 1), 1);
		const safeLimit = Math.min(Math.max(parseIntOrDefault(limit, 20), 1), 100);

		const filter: Record<string, unknown> = {};
		if (statusFilter && statusFilter !== "all") {
			filter.status = statusFilter;
		}
		if (sectorFilter && sectorFilter !== "all") {
			filter.sector = sectorFilter;
		}

		const skip = (safePage - 1) * safeLimit;
		const total = await Submission.countDocuments(filter);
		const submissions = await Submission.find(filter)
			.populate("entrepreneurId", "fullName email")
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(safeLimit);

		const stats = {
			total: await Submission.countDocuments(),
			draft: await Submission.countDocuments({ status: "draft" }),
			submitted: await Submission.countDocuments({ status: "submitted" }),
			under_review: await Submission.countDocuments({ status: "under_review" }),
			approved: await Submission.countDocuments({ status: "approved" }),
			rejected: await Submission.countDocuments({ status: "rejected" }),
			suspended: await Submission.countDocuments({ status: "suspended" }),
		};

		return {
			submissions,
			total,
			page: safePage,
			totalPages: Math.ceil(total / safeLimit),
			stats,
		};
	}

	static async updateAdminStatus(id: string, status: string, reason?: string) {
		const submission = await Submission.findById(id);
		if (!submission) {
			throw SubmissionService.createError("Submission not found", 404);
		}

		if (submission.status === "draft") {
			throw SubmissionService.createError(
				"Cannot change status of a draft pitch.",
				400,
			);
		}

		submission.status = status as "approved" | "rejected" | "suspended";

		// If rejected or suspended, we might want to store the reason somewhere
		// (e.g., `adminFeedback: reason` in schema, but for now we just change status).

		await submission.save();

		// SC-17: "The system immediately sends a push notification to the user..."
		// This is where NotificationService.createNotification(...) would go in Phase 3/4.

		return submission;
	}
}
