import { AdminAction } from "../../models/AdminAction";
import { Document } from "../../models/Document";
import { Feedback } from "../../models/Feedback";
import { Invitation } from "../../models/Invitation";
import { MatchResult } from "../../models/MatchResult";
import { Submission } from "../../models/Submission";
import { User } from "../../models/User";

export const normalizeLookbackDays = (input?: number) => {
	const days = Number.isFinite(input) ? Number(input) : 30;
	return Math.min(Math.max(Math.floor(days), 1), 365);
};

export class AdminStatsService {
	static async getDashboardStats(days?: number) {
		const lookbackDays = normalizeLookbackDays(days);
		const lookbackDate = new Date(
			Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
		);

		const toCountMap = (rows: Array<{ _id: string; count: number }>) =>
			rows.reduce<Record<string, number>>((acc, row) => {
				if (row?._id) {
					acc[row._id] = row.count;
				}
				return acc;
			}, {});

		const [
			totalUsers,
			userRoleBreakdown,
			userStatusBreakdown,
			totalSubmissions,
			submissionStatusRows,
			totalDocuments,
			documentStatusRows,
			totalMatches,
			matchStatusRows,
			totalInvitations,
			invitationStatusRows,
			feedbackSummary,
			recentActions,
		] = await Promise.all([
			User.countDocuments({}),
			User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
			User.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
			Submission.countDocuments({}),
			Submission.aggregate<{ _id: string; count: number }>([
				{ $match: { createdAt: { $gte: lookbackDate } } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
			Document.countDocuments({}),
			Document.aggregate<{ _id: string; count: number }>([
				{ $match: { createdAt: { $gte: lookbackDate } } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
			MatchResult.countDocuments({}),
			MatchResult.aggregate<{ _id: string; count: number }>([
				{ $match: { createdAt: { $gte: lookbackDate } } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
			Invitation.countDocuments({}),
			Invitation.aggregate<{ _id: string; count: number }>([
				{ $match: { createdAt: { $gte: lookbackDate } } },
				{ $group: { _id: "$status", count: { $sum: 1 } } },
			]),
			Feedback.aggregate([
				{
					$group: {
						_id: null,
						averageRating: { $avg: "$rating" },
						total: { $sum: 1 },
					},
				},
			]),
			AdminAction.find({})
				.sort({ createdAt: -1 })
				.limit(20)
				.populate("adminId", "fullName email"),
		]);

		const submissionStatusBreakdown = toCountMap(submissionStatusRows);
		const documentStatusBreakdown = toCountMap(documentStatusRows);
		const matchStatusBreakdown = toCountMap(matchStatusRows);
		const invitationStatusBreakdown = toCountMap(invitationStatusRows);

		return {
			generatedAt: new Date().toISOString(),
			lookbackDays,
			users: {
				total: totalUsers,
				roles: toCountMap(userRoleBreakdown),
				statuses: toCountMap(userStatusBreakdown),
			},
			submissions: {
				total: totalSubmissions,
				statusInLookback: submissionStatusBreakdown,
			},
			documents: {
				total: totalDocuments,
				statusInLookback: documentStatusBreakdown,
			},
			matching: {
				totalMatches,
				matchStatusInLookback: matchStatusBreakdown,
				totalInvitations,
				invitationStatusInLookback: invitationStatusBreakdown,
			},
			feedback: {
				total: feedbackSummary[0]?.total ?? 0,
				averageRating: Number(
					(feedbackSummary[0]?.averageRating ?? 0).toFixed(2),
				),
			},
			recentActions,
		};
	}
}
