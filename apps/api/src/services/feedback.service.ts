import { Feedback, type FeedbackCategory } from "../models/Feedback";
import { Invitation } from "../models/Invitation";
import { MatchResult } from "../models/MatchResult";
import { NotificationService } from "./notification.service";

type FeedbackAggregateInput = Array<{
	rating: number;
	category: FeedbackCategory;
}>;

export const calculateFeedbackSummary = (
	feedbackEntries: FeedbackAggregateInput,
) => {
	const totalCount = feedbackEntries.length;
	if (totalCount === 0) {
		return {
			totalCount: 0,
			overallAverage: 0,
			categories: {
				overall: { average: 0, count: 0 },
				communication: { average: 0, count: 0 },
				professionalism: { average: 0, count: 0 },
				pitch_quality: { average: 0, count: 0 },
				collaboration: { average: 0, count: 0 },
			},
		};
	}

	const categories: Record<FeedbackCategory, { total: number; count: number }> =
		{
			overall: { total: 0, count: 0 },
			communication: { total: 0, count: 0 },
			professionalism: { total: 0, count: 0 },
			pitch_quality: { total: 0, count: 0 },
			collaboration: { total: 0, count: 0 },
		};

	let sum = 0;
	for (const entry of feedbackEntries) {
		sum += entry.rating;
		categories[entry.category].total += entry.rating;
		categories[entry.category].count += 1;
	}

	const categoriesSummary = {
		overall: {
			average:
				categories.overall.count === 0
					? 0
					: Number(
							(categories.overall.total / categories.overall.count).toFixed(2),
						),
			count: categories.overall.count,
		},
		communication: {
			average:
				categories.communication.count === 0
					? 0
					: Number(
							(
								categories.communication.total / categories.communication.count
							).toFixed(2),
						),
			count: categories.communication.count,
		},
		professionalism: {
			average:
				categories.professionalism.count === 0
					? 0
					: Number(
							(
								categories.professionalism.total /
								categories.professionalism.count
							).toFixed(2),
						),
			count: categories.professionalism.count,
		},
		pitch_quality: {
			average:
				categories.pitch_quality.count === 0
					? 0
					: Number(
							(
								categories.pitch_quality.total / categories.pitch_quality.count
							).toFixed(2),
						),
			count: categories.pitch_quality.count,
		},
		collaboration: {
			average:
				categories.collaboration.count === 0
					? 0
					: Number(
							(
								categories.collaboration.total / categories.collaboration.count
							).toFixed(2),
						),
			count: categories.collaboration.count,
		},
	};

	return {
		totalCount,
		overallAverage: Number((sum / totalCount).toFixed(2)),
		categories: categoriesSummary,
	};
};

class FeedbackServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "FeedbackServiceError";
		this.statusCode = statusCode;
	}
}

export const FeedbackService = {
	createError(message: string, statusCode: number): FeedbackServiceError {
		return new FeedbackServiceError(message, statusCode);
	},

	isServiceError(error: unknown): error is FeedbackServiceError {
		return error instanceof FeedbackServiceError;
	},

	async createFeedback(payload: {
		fromUserId: string;
		toUserId: string;
		rating: number;
		category?: FeedbackCategory;
		comment?: string;
		invitationId?: string;
		matchResultId?: string;
		submissionId?: string;
	}) {
		if (payload.fromUserId === payload.toUserId) {
			throw FeedbackService.createError(
				"You cannot leave feedback for yourself",
				400,
			);
		}

		if (payload.invitationId) {
			const invitation = await Invitation.findById(payload.invitationId);
			if (!invitation) {
				throw FeedbackService.createError("Invitation not found", 404);
			}

			if (invitation.status !== "accepted") {
				throw FeedbackService.createError(
					"Feedback can only be submitted for accepted invitations",
					400,
				);
			}

			const participants = new Set([
				invitation.senderId.toString(),
				invitation.receiverId.toString(),
			]);

			if (
				!participants.has(payload.fromUserId) ||
				!participants.has(payload.toUserId)
			) {
				throw FeedbackService.createError(
					"Feedback participants must belong to the invitation",
					403,
				);
			}
		}

		if (payload.matchResultId) {
			const match = await MatchResult.findById(payload.matchResultId);
			if (!match) {
				throw FeedbackService.createError("Match not found", 404);
			}

			const participants = new Set([
				match.entrepreneurId.toString(),
				match.investorId.toString(),
			]);
			if (
				!participants.has(payload.fromUserId) ||
				!participants.has(payload.toUserId)
			) {
				throw FeedbackService.createError(
					"Feedback participants must belong to the match",
					403,
				);
			}
		}

		const feedback = await Feedback.create({
			invitationId: payload.invitationId || null,
			matchResultId: payload.matchResultId || null,
			submissionId: payload.submissionId || null,
			fromUserId: payload.fromUserId,
			toUserId: payload.toUserId,
			rating: payload.rating,
			category: payload.category || "overall",
			comment: payload.comment || null,
		});

		await NotificationService.createNotification({
			userId: payload.toUserId,
			type: "feedback_received",
			title: "New feedback received",
			body: "You have received new collaboration feedback.",
			metadata: {
				feedbackId: feedback._id,
				invitationId: payload.invitationId || null,
				matchResultId: payload.matchResultId || null,
			},
		});

		return feedback;
	},

	async listReceivedFeedback(userId: string) {
		return Feedback.find({ toUserId: userId })
			.sort({ createdAt: -1 })
			.populate("fromUserId", "fullName email role")
			.populate("invitationId", "status")
			.populate("submissionId", "title status");
	},

	async listGivenFeedback(userId: string) {
		return Feedback.find({ fromUserId: userId })
			.sort({ createdAt: -1 })
			.populate("toUserId", "fullName email role")
			.populate("invitationId", "status")
			.populate("submissionId", "title status");
	},

	async getFeedbackSummary(userId: string) {
		const feedbackEntries = await Feedback.find({ toUserId: userId })
			.select("rating category")
			.lean<Array<{ rating: number; category: FeedbackCategory }>>();

		return calculateFeedbackSummary(feedbackEntries);
	},
};
