import mongoose from "mongoose";
import { LedgerEntry } from "../models/LedgerEntry";
import { Milestone } from "../models/Milestone";
import { PendingPayment } from "../models/PendingPayment";

const getPopulatedSubmission = (value: unknown) => {
	if (!value || typeof value !== "object") {
		return null;
	}

	if (!("_id" in value)) {
		return null;
	}

	const submissionId = (
		value as { _id: { toString(): string } }
	)._id.toString();
	const title =
		"title" in value && typeof value.title === "string"
			? value.title
			: "Unknown Project";

	return { submissionId, title };
};

export const FinanceService = {
	/**
	 * Get financial summary for an investor
	 */
	async getInvestorSummary(investorId: string) {
		const investorObjectId = new mongoose.Types.ObjectId(investorId);

		const ledgerEntries = await LedgerEntry.find({
			fromUserId: investorObjectId,
		})
			.populate("milestoneId", "title")
			.populate("submissionId", "title")
			.sort({ createdAt: -1 });

		const stats = ledgerEntries.reduce(
			(acc, entry) => {
				if (entry.type === "escrow_hold" && entry.status === "completed") {
					acc.totalCommitted += entry.amount;
				} else if (
					entry.type === "escrow_release" &&
					entry.status === "completed"
				) {
					acc.totalReleased += entry.amount;
				} else if (
					entry.type === "platform_fee" &&
					entry.status === "completed"
				) {
					acc.platformFeesPaid += entry.amount;
				}
				return acc;
			},
			{ totalCommitted: 0, totalReleased: 0, platformFeesPaid: 0 },
		);

		// Group by project
		const perProjectMap = new Map<
			string,
			{
				title: string;
				milestoneCount: number;
				paidMilestones: number;
				totalInvested: number;
				escrowStatus: "none";
			}
		>();
		for (const entry of ledgerEntries) {
			if (!entry.submissionId) continue;
			const sub = getPopulatedSubmission(entry.submissionId);
			if (!sub) continue;
			const subId = sub.submissionId;
			if (!perProjectMap.has(subId)) {
				perProjectMap.set(subId, {
					title: sub.title,
					milestoneCount: 0,
					paidMilestones: 0,
					totalInvested: 0,
					escrowStatus: "none",
				});
			}
			const project = perProjectMap.get(subId);
			if (!project) continue;
			if (entry.type === "escrow_hold") {
				project.totalInvested += entry.amount;
			}
		}

		return {
			...stats,
			perProject: Array.from(perProjectMap.values()),
			recentLedger: ledgerEntries.slice(0, 20),
		};
	},

	/**
	 * Get financial summary for an entrepreneur
	 */
	async getEntrepreneurSummary(entrepreneurId: string) {
		const entrepreneurObjectId = new mongoose.Types.ObjectId(entrepreneurId);

		const payoutEntries = await LedgerEntry.find({
			toUserId: entrepreneurObjectId,
			type: "milestone_payout",
		})
			.populate("milestoneId", "title")
			.populate("submissionId", "title")
			.sort({ createdAt: -1 });

		const totalReceived = payoutEntries
			.filter((e) => e.status === "completed")
			.reduce((sum, e) => sum + e.amount, 0);

		// Fetch milestones awaiting disbursement
		const pendingMilestones = await Milestone.find({
			entrepreneurId: entrepreneurObjectId,
			escrowStatus: "held",
			status: "verified_paid",
		}).populate("submissionId", "title");

		const pendingRelease = pendingMilestones.reduce(
			(sum, m) => sum + m.amount,
			0,
		);

		return {
			totalReceived,
			pendingRelease,
			recentPayouts: payoutEntries.slice(0, 20).map((e) => ({
				_id: e._id,
				transactionId: e.transactionId,
				amount: e.amount,
				status: e.status,
				description: e.description,
				occurredAt: e.occurredAt,
				milestoneId: e.milestoneId,
			})),
			pendingMilestones: pendingMilestones.map((m) => ({
				id: m._id,
				title: m.title,
				amount: m.amount,
				projectTitle: getPopulatedSubmission(m.submissionId)?.title,
			})),
		};
	},

	/**
	 * Get platform-wide financial summary for admin
	 */
	async getAdminLedger() {
		const allEntries = await LedgerEntry.find()
			.sort({ createdAt: -1 })
			.limit(100);

		const stats = await LedgerEntry.aggregate([
			{
				$group: {
					_id: "$type",
					total: { $sum: "$amount" },
				},
			},
		]);

		const statMap = stats.reduce(
			(acc: Record<string, number>, curr: { _id: string; total: number }) => {
				acc[curr._id] = curr.total;
				return acc;
			},
			{},
		);

		const totalEscrowHeld =
			(statMap.escrow_hold || 0) - (statMap.escrow_release || 0);
		const totalDisbursed = statMap.milestone_payout || 0;
		const totalFees = statMap.platform_fee || 0;

		const awaitingDisbursement = await Milestone.find({
			escrowStatus: "held",
			status: "verified_paid",
		})
			.populate("entrepreneurId", "fullName email")
			.populate("investorId", "fullName email")
			.populate("submissionId", "title");

		const pendingChapa = await PendingPayment.find({
			status: "pending",
			createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
		}).populate("userId", "fullName email");

		return {
			totalEscrowHeld,
			totalDisbursed,
			totalFees,
			ledger: allEntries,
			awaitingDisbursement,
			pendingChapa,
		};
	},

	/**
	 * Disburse funds for a milestone
	 */
	async disburseMilestone(payload: {
		milestoneId: string;
		paymentReference?: string;
		notes?: string;
	}) {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const milestone = await Milestone.findById(payload.milestoneId).session(
				session,
			);

			if (!milestone) throw new Error("Milestone not found");
			if (
				milestone.escrowStatus !== "held" ||
				milestone.status !== "verified_paid"
			) {
				throw new Error("Milestone is not eligible for disbursement");
			}

			// Update milestone
			milestone.escrowStatus = "released";
			milestone.paymentReleasedAt = new Date();
			milestone.paymentReference = payload.paymentReference;
			await milestone.save({ session });

			// Ledger: Release from Escrow
			await LedgerEntry.create(
				[
					{
						transactionId: `REL-${milestone._id}-${Date.now()}`,
						type: "escrow_release",
						status: "completed",
						amount: milestone.amount,
						currency: milestone.currency,
						toUserId: milestone.entrepreneurId,
						fromUserId: milestone.investorId,
						milestoneId: milestone._id,
						submissionId: milestone.submissionId,
						description: `Escrow release for milestone: ${milestone.title}`,
						occurredAt: new Date(),
					},
				],
				{ session },
			);

			// Ledger: Milestone Payout to Entrepreneur
			await LedgerEntry.create(
				[
					{
						transactionId: `PAY-${milestone._id}-${Date.now()}`,
						type: "milestone_payout",
						status: "completed",
						amount: milestone.amount,
						currency: milestone.currency,
						toUserId: milestone.entrepreneurId,
						milestoneId: milestone._id,
						submissionId: milestone.submissionId,
						description: `Payout for milestone: ${milestone.title}`,
						occurredAt: new Date(),
					},
				],
				{ session },
			);

			await session.commitTransaction();
			return milestone;
		} catch (error) {
			await session.abortTransaction();
			throw error;
		} finally {
			session.endSession();
		}
	},
};
