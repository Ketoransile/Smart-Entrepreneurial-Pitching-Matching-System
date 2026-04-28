import { Invitation, type InvitationStatus } from "../models/Invitation";
import { MatchResult } from "../models/MatchResult";
import { NotificationService } from "./notification.service";

class InvitationServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "InvitationServiceError";
		this.statusCode = statusCode;
	}
}

export const resolveInvitationCounterparty = (payload: {
	matchEntrepreneurId: string;
	matchInvestorId: string;
	senderId: string;
}) => {
	if (payload.senderId === payload.matchEntrepreneurId) {
		return {
			entrepreneurId: payload.matchEntrepreneurId,
			investorId: payload.matchInvestorId,
			receiverId: payload.matchInvestorId,
		};
	}

	if (payload.senderId === payload.matchInvestorId) {
		return {
			entrepreneurId: payload.matchEntrepreneurId,
			investorId: payload.matchInvestorId,
			receiverId: payload.matchEntrepreneurId,
		};
	}

	throw new InvitationServiceError("You are not part of this match", 403);
};

export const InvitationService = {
	createError(message: string, statusCode: number): InvitationServiceError {
		return new InvitationServiceError(message, statusCode);
	},

	isServiceError(error: unknown): error is InvitationServiceError {
		return error instanceof InvitationServiceError;
	},

	async sendInvitation(payload: {
		matchId: string;
		senderId: string;
		message?: string;
		expiresInDays?: number;
	}) {
		const match = await MatchResult.findById(payload.matchId);
		if (!match) {
			throw InvitationService.createError("Match not found", 404);
		}

		if (match.status !== "accepted") {
			throw InvitationService.createError(
				"Invitation can only be sent after a match is accepted",
				400,
			);
		}

		const parties = resolveInvitationCounterparty({
			matchEntrepreneurId: match.entrepreneurId.toString(),
			matchInvestorId: match.investorId.toString(),
			senderId: payload.senderId,
		});

		const existingPending = await Invitation.findOne({
			matchResultId: match._id,
			senderId: payload.senderId,
			receiverId: parties.receiverId,
			status: "pending",
		});

		if (existingPending) {
			throw InvitationService.createError(
				"A pending invitation already exists",
				409,
			);
		}

		const safeExpiresInDays = Math.min(
			Math.max(payload.expiresInDays ?? 14, 1),
			30,
		);
		const invitation = await Invitation.create({
			matchResultId: match._id,
			submissionId: match.submissionId,
			entrepreneurId: parties.entrepreneurId,
			investorId: parties.investorId,
			senderId: payload.senderId,
			receiverId: parties.receiverId,
			message: payload.message || null,
			sentAt: new Date(),
			expiresAt: new Date(Date.now() + safeExpiresInDays * 24 * 60 * 60 * 1000),
			status: "pending",
		});

		await NotificationService.createNotification({
			userId: parties.receiverId,
			type: "invitation_received",
			title: "New invitation",
			body: "You received a connection invitation from a match.",
			metadata: {
				invitationId: invitation._id,
				matchId: match._id,
				submissionId: match.submissionId,
			},
		});

		return invitation;
	},

	async listInvitationsForUser(payload: {
		userId: string;
		status?: InvitationStatus;
		direction?: "sent" | "received" | "all";
	}) {
		const filter: Record<string, unknown> = {};

		if (payload.direction === "sent") {
			filter.senderId = payload.userId;
		} else if (payload.direction === "received") {
			filter.receiverId = payload.userId;
		} else {
			filter.$or = [
				{ senderId: payload.userId },
				{ receiverId: payload.userId },
			];
		}

		if (payload.status) {
			filter.status = payload.status;
		}

		return Invitation.find(filter)
			.sort({ createdAt: -1 })
			.populate("senderId", "fullName email role")
			.populate("receiverId", "fullName email role")
			.populate("submissionId", "title status")
			.populate("matchResultId", "score status");
	},

	async respondToInvitation(payload: {
		invitationId: string;
		userId: string;
		status: "accepted" | "declined";
		responseMessage?: string;
	}) {
		const invitation = await Invitation.findById(payload.invitationId);
		if (!invitation) {
			throw InvitationService.createError("Invitation not found", 404);
		}

		if (invitation.receiverId.toString() !== payload.userId) {
			throw InvitationService.createError(
				"Only the recipient can respond to this invitation",
				403,
			);
		}

		if (invitation.status !== "pending") {
			throw InvitationService.createError("Invitation is not pending", 400);
		}

		if (invitation.expiresAt.getTime() < Date.now()) {
			invitation.status = "expired";
			await invitation.save();
			throw InvitationService.createError("Invitation has expired", 400);
		}

		invitation.status = payload.status;
		invitation.responseMessage = payload.responseMessage || undefined;
		invitation.respondedAt = new Date();
		await invitation.save();

		await NotificationService.createNotification({
			userId: invitation.senderId.toString(),
			type:
				payload.status === "accepted"
					? "invitation_accepted"
					: "invitation_declined",
			title:
				payload.status === "accepted"
					? "Invitation accepted"
					: "Invitation declined",
			body:
				payload.status === "accepted"
					? "Your invitation has been accepted."
					: "Your invitation has been declined.",
			metadata: {
				invitationId: invitation._id,
				matchId: invitation.matchResultId,
				submissionId: invitation.submissionId,
			},
		});

		return invitation;
	},

	async cancelInvitation(payload: { invitationId: string; userId: string }) {
		const invitation = await Invitation.findById(payload.invitationId);
		if (!invitation) {
			throw InvitationService.createError("Invitation not found", 404);
		}

		if (invitation.senderId.toString() !== payload.userId) {
			throw InvitationService.createError(
				"Only the sender can cancel this invitation",
				403,
			);
		}

		if (invitation.status !== "pending") {
			throw InvitationService.createError(
				"Only pending invitations can be cancelled",
				400,
			);
		}

		invitation.status = "cancelled";
		invitation.respondedAt = new Date();
		await invitation.save();

		return invitation;
	},
};
