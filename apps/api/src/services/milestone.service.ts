import { Types } from "mongoose";
import { MatchResult } from "../models/MatchResult";
import {
	type IMilestoneEvidenceDocument,
	Milestone,
	type MilestoneStatus,
} from "../models/Milestone";
import { NotificationService } from "./notification.service";
import { PaymentService } from "./payment.service";

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
	"planned",
	"in_progress",
	"rejected",
]);

export class MilestoneService {
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
				"Milestones can only be created for accepted matches",
				400,
			);
		}

		if (match.submissionId.toString() !== payload.submissionId) {
			throw MilestoneService.createError(
				"Match does not belong to submission",
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
			matchResultId: payload.matchResultId,
			entrepreneurId: match.entrepreneurId,
			investorId: match.investorId,
			createdBy: payload.actorId,
			title: payload.title.trim(),
			description: payload.description?.trim() || null,
			amount: Number(payload.amount.toFixed(2)),
			currency: (payload.currency || "USD").toUpperCase(),
			dueDate,
			status: "planned",
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
		status?: Extract<MilestoneStatus, "planned" | "in_progress" | "cancelled">;
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
		milestone.status = "submitted";
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

		if (milestone.status !== "submitted") {
			throw MilestoneService.createError(
				"Only submitted milestones can be verified",
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

		milestone.status = "approved";
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

		milestone.status = "paid";
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
}
