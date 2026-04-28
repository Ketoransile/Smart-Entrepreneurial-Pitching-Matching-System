import { Types } from "mongoose";
import { MatchResult } from "../models/MatchResult";
import {
	type IMilestoneEvidenceDocument,
	Milestone,
	type MilestoneStatus,
} from "../models/Milestone";
import { NotificationService } from "./notification.service";
import { PaymentService, simulatePayment } from "./payment.service";
import { TransactionService } from "./transaction.service";

class MilestoneServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "MilestoneServiceError";
		this.statusCode = statusCode;
	}
}

export const normalizeEvidenceDocuments = (
	documents?: Array<Partial<IMilestoneEvidenceDocument>>,
): IMilestoneEvidenceDocument[] => {
	if (!Array.isArray(documents)) {
		return [];
	}

	return documents
		.filter(
			(doc) =>
				typeof doc?.name === "string" &&
				typeof doc?.url === "string" &&
				doc.name.trim().length > 0 &&
				doc.url.trim().length > 0,
		)
		.map((doc) => ({
			name: (doc.name as string).trim(),
			url: (doc.url as string).trim(),
			type:
				doc.type &&
				[
					"invoice",
					"report",
					"delivery_note",
					"photo",
					"video",
					"other",
				].includes(doc.type)
					? doc.type
					: "other",
			uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date(),
		}));
};

export const canManageMilestone = (payload: {
	milestoneEntrepreneurId: string;
	milestoneInvestorId: string;
	actorId: string;
	actorRole: "entrepreneur" | "investor" | "admin";
}) => {
	if (payload.actorRole === "admin") {
		return true;
	}
	if (
		payload.actorRole === "entrepreneur" &&
		payload.actorId === payload.milestoneEntrepreneurId
	) {
		return true;
	}
	if (
		payload.actorRole === "investor" &&
		payload.actorId === payload.milestoneInvestorId
	) {
		return true;
	}
	return false;
};

export const canVerifyMilestone = (payload: {
	milestoneInvestorId: string;
	actorId: string;
	actorRole: "entrepreneur" | "investor" | "admin";
}) => {
	if (payload.actorRole === "admin") {
		return true;
	}
	return (
		payload.actorRole === "investor" &&
		payload.actorId === payload.milestoneInvestorId
	);
};

const updatableStatuses = new Set<MilestoneStatus>([
	"pending",
	"in_progress",
	"rejected",
]);

export class MilestoneService {
	private constructor() {}

	static createError(message: string, statusCode: number) {
		return new MilestoneServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is MilestoneServiceError {
		return error instanceof MilestoneServiceError;
	}

	static async createMilestone(payload: {
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		submissionId: string;
		matchResultId: string;
		title: string;
		description?: string;
		amount: number;
		currency?: string;
		dueDate: string;
	}) {
		const match = await MatchResult.findById(payload.matchResultId);
		if (!match) {
			throw MilestoneService.createError("Match not found", 404);
		}

		if (match.status !== "accepted") {
			throw MilestoneService.createError(
				`Milestones can only be created for accepted matches (current: ${match.status})`,
				400,
			);
		}

		if (match.submissionId.toString() !== payload.submissionId) {
			throw MilestoneService.createError(
				"Match does not belong to the selected project",
				400,
			);
		}

		const allowed = canManageMilestone({
			milestoneEntrepreneurId: match.entrepreneurId.toString(),
			milestoneInvestorId: match.investorId.toString(),
			actorId: payload.actorId,
			actorRole: payload.actorRole,
		});

		if (!allowed) {
			throw MilestoneService.createError(
				"You are not allowed to create milestones for this match",
				403,
			);
		}

		if (!payload.title?.trim()) {
			throw MilestoneService.createError("Milestone title is required", 400);
		}

		if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
			throw MilestoneService.createError(
				"Milestone amount must be greater than zero",
				400,
			);
		}

		const dueDate = new Date(payload.dueDate);
		if (Number.isNaN(dueDate.getTime())) {
			throw MilestoneService.createError("A valid due date is required", 400);
		}

		const milestone = await Milestone.create({
			submissionId: payload.submissionId,
			matchResultId: match._id,
			entrepreneurId: match.entrepreneurId,
			investorId: match.investorId,
			createdBy: payload.actorId,
			title: payload.title.trim(),
			description: payload.description?.trim() || null,
			amount: Number(payload.amount.toFixed(2)),
			currency: (payload.currency || "ETB").toUpperCase(),
			dueDate,
			status: "pending",
			escrowStatus: "not_held",
			evidenceDocuments: [],
		});

		const escrowResult = await PaymentService.holdEscrowForMilestone({
			milestoneId: milestone._id.toString(),
			submissionId: milestone.submissionId.toString(),
			matchResultId: milestone.matchResultId.toString(),
			investorId: milestone.investorId.toString(),
			entrepreneurId: milestone.entrepreneurId.toString(),
			amount: milestone.amount,
			currency: milestone.currency,
		});

		milestone.escrowStatus = "held";
		milestone.escrowReference = escrowResult.event.providerReference;
		await milestone.save();

		const counterpartyUserId =
			payload.actorId === milestone.investorId.toString()
				? milestone.entrepreneurId.toString()
				: milestone.investorId.toString();

		await NotificationService.createNotification({
			userId: counterpartyUserId,
			type: "milestone_updated",
			title: "New funding milestone created",
			body: `${milestone.title} has been created for ${milestone.currency} ${milestone.amount}.`,
			metadata: {
				milestoneId: milestone._id,
				submissionId: milestone.submissionId,
				matchResultId: milestone.matchResultId,
			},
		});

		return milestone;
	}

	static async listMilestones(payload: {
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		submissionId?: string;
		matchResultId?: string;
		status?: MilestoneStatus;
	}) {
		const filter: Record<string, unknown> = {};

		if (payload.actorRole === "entrepreneur") {
			filter.entrepreneurId = payload.actorId;
		}
		if (payload.actorRole === "investor") {
			filter.investorId = payload.actorId;
		}
		if (payload.submissionId) {
			filter.submissionId = payload.submissionId;
		}
		if (payload.matchResultId) {
			filter.matchResultId = payload.matchResultId;
		}
		if (payload.status) {
			filter.status = payload.status;
		}

		return Milestone.find(filter)
			.sort({ dueDate: 1, createdAt: -1 })
			.populate("submissionId", "title status")
			.populate("entrepreneurId", "fullName email")
			.populate("investorId", "fullName email");
	}

	static async getMilestoneById(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);

		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const allowed = canManageMilestone({
			milestoneEntrepreneurId: milestone.entrepreneurId.toString(),
			milestoneInvestorId: milestone.investorId.toString(),
			actorId: payload.actorId,
			actorRole: payload.actorRole,
		});

		if (!allowed) {
			throw MilestoneService.createError("Access denied", 403);
		}

		return Milestone.findById(payload.milestoneId)
			.populate("submissionId", "title status")
			.populate("entrepreneurId", "fullName email")
			.populate("investorId", "fullName email")
			.populate("verifiedBy", "fullName email");
	}

	static async updateMilestone(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		title?: string;
		description?: string;
		amount?: number;
		dueDate?: string;
		status?: Extract<MilestoneStatus, "pending" | "in_progress" | "cancelled">;
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const allowed = canManageMilestone({
			milestoneEntrepreneurId: milestone.entrepreneurId.toString(),
			milestoneInvestorId: milestone.investorId.toString(),
			actorId: payload.actorId,
			actorRole: payload.actorRole,
		});

		if (!allowed) {
			throw MilestoneService.createError("Access denied", 403);
		}

		if (
			!updatableStatuses.has(milestone.status) &&
			payload.actorRole !== "admin"
		) {
			throw MilestoneService.createError(
				"Milestone cannot be updated in its current status",
				400,
			);
		}

		if (payload.title !== undefined) {
			milestone.title = payload.title.trim();
		}
		if (payload.description !== undefined) {
			milestone.description = payload.description?.trim() || undefined;
		}
		if (payload.amount !== undefined) {
			if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
				throw MilestoneService.createError(
					"Milestone amount must be greater than zero",
					400,
				);
			}
			milestone.amount = Number(payload.amount.toFixed(2));
		}
		if (payload.dueDate !== undefined) {
			const dueDate = new Date(payload.dueDate);
			if (Number.isNaN(dueDate.getTime())) {
				throw MilestoneService.createError("A valid due date is required", 400);
			}
			milestone.dueDate = dueDate;
		}
		if (payload.status !== undefined) {
			milestone.status = payload.status;
		}

		await milestone.save();
		return milestone;
	}

	static async submitEvidence(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		evidenceDocuments: Array<Partial<IMilestoneEvidenceDocument>>;
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const isEntrepreneur =
			(payload.actorRole === "entrepreneur" || payload.actorRole === "admin") &&
			(payload.actorRole === "admin" ||
				milestone.entrepreneurId.toString() === payload.actorId);

		if (!isEntrepreneur) {
			throw MilestoneService.createError(
				"Only the entrepreneur can submit milestone evidence",
				403,
			);
		}

		const normalizedDocs = normalizeEvidenceDocuments(
			payload.evidenceDocuments,
		);
		if (normalizedDocs.length === 0) {
			throw MilestoneService.createError(
				"At least one evidence document is required",
				400,
			);
		}

		milestone.evidenceDocuments = normalizedDocs;
		milestone.status = "submitted_for_review";
		milestone.submittedAt = new Date();
		await milestone.save();

		await NotificationService.createNotification({
			userId: milestone.investorId.toString(),
			type: "milestone_updated",
			title: "Milestone submitted for verification",
			body: `${milestone.title} has been submitted with evidence documents.`,
			metadata: {
				milestoneId: milestone._id,
				submissionId: milestone.submissionId,
				matchResultId: milestone.matchResultId,
			},
		});

		return milestone;
	}

	static async verifyMilestone(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		approved: boolean;
		notes?: string;
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		if (milestone.status !== "submitted_for_review") {
			throw MilestoneService.createError(
				"Only milestones submitted for review can be verified",
				400,
			);
		}

		const allowed = canVerifyMilestone({
			milestoneInvestorId: milestone.investorId.toString(),
			actorId: payload.actorId,
			actorRole: payload.actorRole,
		});

		if (!allowed) {
			throw MilestoneService.createError(
				"Only the investor can verify this milestone",
				403,
			);
		}

		milestone.verifiedAt = new Date();
		milestone.verifiedBy = new Types.ObjectId(payload.actorId);
		milestone.verificationNotes = payload.notes?.trim() || undefined;

		if (!payload.approved) {
			milestone.status = "rejected";
			await milestone.save();

			await NotificationService.createNotification({
				userId: milestone.entrepreneurId.toString(),
				type: "milestone_updated",
				title: "Milestone rejected",
				body: `${milestone.title} was rejected. Please review and resubmit evidence.`,
				metadata: {
					milestoneId: milestone._id,
					submissionId: milestone.submissionId,
					matchResultId: milestone.matchResultId,
				},
			});

			return {
				milestone,
				payout: null,
			};
		}

		milestone.status = "verified_paid";
		await milestone.save();

		const payout = await PaymentService.releaseMilestoneFunds({
			milestoneId: milestone._id.toString(),
			submissionId: milestone.submissionId.toString(),
			matchResultId: milestone.matchResultId.toString(),
			investorId: milestone.investorId.toString(),
			entrepreneurId: milestone.entrepreneurId.toString(),
			amount: milestone.amount,
			currency: milestone.currency,
		});

		milestone.escrowStatus = "released";
		milestone.paymentReleasedAt = new Date();
		milestone.paymentReference = payout.event.providerReference;
		await milestone.save();

		await NotificationService.createNotification({
			userId: milestone.entrepreneurId.toString(),
			type: "milestone_updated",
			title: "Milestone approved and paid",
			body: `${milestone.title} has been approved. Simulated payout has been released.`,
			metadata: {
				milestoneId: milestone._id,
				submissionId: milestone.submissionId,
				matchResultId: milestone.matchResultId,
				paymentReference: payout.event.providerReference,
			},
		});

		return {
			milestone,
			payout,
		};
	}

	/**
	 * Centralized status transition workflow.
	 *
	 * State machine:
	 *   pending → submitted_for_review   (Entrepreneur only)
	 *   submitted_for_review → verified_paid  (Investor only — triggers simulated payment + TransactionLog)
	 *   submitted_for_review → rejected  (Investor only — saves feedback)
	 */
	static async transitionStatus(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		targetStatus: "submitted_for_review" | "verified_paid" | "rejected";
		feedback?: string;
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const { targetStatus, actorRole, feedback } = payload;

		// ─── submitted_for_review ───────────────────────────────────────────────
		if (targetStatus === "submitted_for_review") {
			if (actorRole !== "entrepreneur") {
				throw MilestoneService.createError(
					"Only an entrepreneur can submit a milestone for review",
					403,
				);
			}
			if (milestone.status !== "pending") {
				throw MilestoneService.createError(
					"Milestone must be in 'pending' status to submit for review",
					400,
				);
			}

			milestone.status = "submitted_for_review";
			milestone.submittedAt = new Date();
			await milestone.save();

			await NotificationService.createNotification({
				userId: milestone.investorId.toString(),
				type: "milestone_updated",
				title: "Milestone submitted for review",
				body: `"${milestone.title}" has been submitted for your review.`,
				metadata: {
					milestoneId: milestone._id,
					submissionId: milestone.submissionId,
				},
			});

			return { milestone, transaction: null };
		}

		// ─── verified_paid ──────────────────────────────────────────────────────
		if (targetStatus === "verified_paid") {
			if (actorRole !== "investor") {
				throw MilestoneService.createError(
					"Only an investor can approve and release payment for a milestone",
					403,
				);
			}
			if (milestone.status !== "submitted_for_review") {
				throw MilestoneService.createError(
					"Milestone must be in 'submitted_for_review' status to verify and pay",
					400,
				);
			}

			// Run simulated payment
			const paymentResult = await simulatePayment(milestone);

			milestone.status = "verified_paid";
			milestone.verifiedAt = new Date();
			milestone.verifiedBy = new Types.ObjectId(payload.actorId);
			milestone.paymentReleasedAt = new Date();
			milestone.paymentReference = paymentResult.providerReference;
			await milestone.save();

			// Log the transaction
			const projectId =
				milestone.projectId?.toString() ??
				milestone.submissionId?.toString() ??
				milestone.matchResultId?.toString();

			const transaction = await TransactionService.logTransaction({
				milestoneId: milestone._id.toString(),
				projectId,
				amount: milestone.amount,
				currency: milestone.currency,
				providerReference: paymentResult.providerReference,
			});

			await NotificationService.createNotification({
				userId: milestone.entrepreneurId.toString(),
				type: "milestone_updated",
				title: "Milestone verified and paid",
				body: `"${milestone.title}" has been approved. Simulated payout of ${milestone.currency} ${milestone.amount} released.`,
				metadata: {
					milestoneId: milestone._id,
					submissionId: milestone.submissionId,
					paymentReference: paymentResult.providerReference,
				},
			});

			return { milestone, transaction, payment: paymentResult };
		}

		// ─── rejected ───────────────────────────────────────────────────────────
		if (targetStatus === "rejected") {
			if (actorRole !== "investor") {
				throw MilestoneService.createError(
					"Only an investor can reject a milestone",
					403,
				);
			}
			if (milestone.status !== "submitted_for_review") {
				throw MilestoneService.createError(
					"Milestone must be in 'submitted_for_review' status to reject",
					400,
				);
			}

			milestone.status = "rejected";
			if (feedback) {
				milestone.feedback = feedback.trim();
				milestone.verificationNotes = feedback.trim();
			}
			milestone.verifiedAt = new Date();
			milestone.verifiedBy = new Types.ObjectId(payload.actorId);
			await milestone.save();

			await NotificationService.createNotification({
				userId: milestone.entrepreneurId.toString(),
				type: "milestone_updated",
				title: "Milestone rejected",
				body: feedback
					? `"${milestone.title}" was rejected: ${feedback}`
					: `"${milestone.title}" was rejected. Please review and resubmit.`,
				metadata: {
					milestoneId: milestone._id,
					submissionId: milestone.submissionId,
				},
			});

			return { milestone, transaction: null };
		}

		throw MilestoneService.createError("Invalid target status", 400);
	}

	/**
	 * Attach or update a proof URL/string on the milestone.
	 * Only the entrepreneur (or admin) can do this.
	 */
	static async attachProof(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
		proof: string;
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const isEntrepreneur =
			payload.actorRole === "admin" ||
			(payload.actorRole === "entrepreneur" &&
				milestone.entrepreneurId.toString() === payload.actorId);

		if (!isEntrepreneur) {
			throw MilestoneService.createError(
				"Only the entrepreneur can upload proof for a milestone",
				403,
			);
		}

		if (!payload.proof || payload.proof.trim().length === 0) {
			throw MilestoneService.createError("Proof URL or text is required", 400);
		}

		milestone.proof = payload.proof.trim();
		await milestone.save();

		return milestone;
	}

	/**
	 * Retrieve proof for a milestone.
	 * Both parties of the milestone can read the proof.
	 */
	static async getProof(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
	}) {
		const milestone = await Milestone.findById(payload.milestoneId).select(
			"proof title status entrepreneurId investorId",
		);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		const allowed = canManageMilestone({
			milestoneEntrepreneurId: milestone.entrepreneurId.toString(),
			milestoneInvestorId: milestone.investorId.toString(),
			actorId: payload.actorId,
			actorRole: payload.actorRole,
		});

		if (!allowed) {
			throw MilestoneService.createError("Access denied", 403);
		}

		return {
			milestoneId: milestone._id,
			title: milestone.title,
			status: milestone.status,
			proof: milestone.proof ?? null,
		};
	}

	/**
	 * List milestones by projectId (the simplified project identifier).
	 * Falls back to querying by submissionId if projectId is stored on milestone.
	 */
	static async getByProject(payload: {
		projectId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
	}) {
		const filter: Record<string, unknown> = {
			$or: [
				{ projectId: payload.projectId },
				{ submissionId: payload.projectId },
			],
		};

		// Scope results to the actor's linked milestones (unless admin)
		if (payload.actorRole === "entrepreneur") {
			filter.entrepreneurId = payload.actorId;
		} else if (payload.actorRole === "investor") {
			filter.investorId = payload.actorId;
		}

		return Milestone.find(filter)
			.sort({ createdAt: -1 })
			.populate("entrepreneurId", "fullName email")
			.populate("investorId", "fullName email");
	}

	/**
	 * Delete a milestone (only when status is "pending", investor or admin only).
	 */
	static async deleteMilestone(payload: {
		milestoneId: string;
		actorId: string;
		actorRole: "entrepreneur" | "investor" | "admin";
	}) {
		const milestone = await Milestone.findById(payload.milestoneId);
		if (!milestone) {
			throw MilestoneService.createError("Milestone not found", 404);
		}

		// Only investors who own this milestone (or admins) can delete it
		const isInvestorOwner =
			payload.actorRole === "investor" &&
			milestone.investorId.toString() === payload.actorId;

		if (!isInvestorOwner && payload.actorRole !== "admin") {
			throw MilestoneService.createError(
				"Only the investor who created this milestone can delete it",
				403,
			);
		}

		if (milestone.status !== "pending" && payload.actorRole !== "admin") {
			throw MilestoneService.createError(
				"Only pending milestones can be deleted",
				400,
			);
		}

		const milestoneTitle = milestone.title;
		const entrepreneurId = milestone.entrepreneurId.toString();

		await Milestone.findByIdAndDelete(payload.milestoneId);

		// Notify the entrepreneur
		await NotificationService.createNotification({
			userId: entrepreneurId,
			type: "milestone_updated",
			title: "Milestone deleted",
			body: `The milestone "${milestoneTitle}" has been deleted by the investor.`,
			metadata: {},
		});

		return { deleted: true, milestoneId: payload.milestoneId };
	}
}
