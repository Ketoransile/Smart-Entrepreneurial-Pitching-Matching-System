import { createHmac, randomUUID } from "node:crypto";

import { LedgerEntry } from "../models/LedgerEntry";
import { type IMilestone, Milestone } from "../models/Milestone";
import { PendingPayment } from "../models/PendingPayment";
import { chapa } from "../utils/chapa";
import {
	buildMockProviderReference,
	MockPaymentProvider,
} from "./mock-payment.provider";
import { TransactionService } from "./transaction.service";

class PaymentServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "PaymentServiceError";
		this.statusCode = statusCode;
	}
}

/**
 * simulatePayment — Simulates a payment for a verified milestone.
 *
 * This function is intentionally decoupled from any real payment provider.
 * To integrate a real gateway (e.g. Chapa), replace this implementation:
 * simply call the provider's charge/transfer API here and return the
 * provider reference on success.
 *
 * @param milestone - The milestone document being paid out
 * @returns A success simulation result with a provider reference
 */
export const simulatePayment = async (milestone: IMilestone) => {
	const providerReference = buildMockProviderReference("sim_payment");
	return {
		success: true,
		providerReference,
		amount: milestone.amount,
		currency: milestone.currency,
		simulatedAt: new Date().toISOString(),
		message: `Simulated payment of ${milestone.currency} ${milestone.amount} released for milestone "${milestone.title}"`,
	};
};

export const calculatePlatformFee = (amount: number, feeRate = 0.02) => {
	const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
	const safeRate = Number.isFinite(feeRate) ? Math.max(feeRate, 0) : 0;
	return Number((safeAmount * safeRate).toFixed(2));
};

export const buildMilestonePayoutLedgerEntries = (payload: {
	milestoneId: string;
	submissionId: string;
	matchResultId: string;
	investorId: string;
	entrepreneurId: string;
	amount: number;
	currency: string;
	providerReference: string;
	platformFeeRate?: number;
}) => {
	const platformFee = calculatePlatformFee(
		payload.amount,
		payload.platformFeeRate ?? 0.02,
	);
	const payoutAmount = Number((payload.amount - platformFee).toFixed(2));

	if (payoutAmount <= 0) {
		throw new PaymentServiceError(
			"Payout amount must be greater than zero",
			400,
		);
	}

	const baseRef = {
		submissionId: payload.submissionId,
		matchResultId: payload.matchResultId,
		milestoneId: payload.milestoneId,
		referenceType: "milestone" as const,
		referenceId: payload.milestoneId,
		provider: "mockpay" as const,
		providerReference: payload.providerReference,
		status: "completed" as const,
		currency: payload.currency,
	};

	const entries: Array<Record<string, unknown>> = [
		{
			transactionId: randomUUID(),
			type: "milestone_payout",
			amount: payoutAmount,
			fromUserId: payload.investorId,
			toUserId: payload.entrepreneurId,
			description: "Milestone payout released to entrepreneur",
			metadata: {
				grossAmount: payload.amount,
				platformFee,
			},
			...baseRef,
		},
	];

	if (platformFee > 0) {
		entries.push({
			transactionId: randomUUID(),
			type: "platform_fee",
			amount: platformFee,
			fromUserId: payload.investorId,
			toUserId: null,
			description: "Platform fee captured from milestone payout",
			metadata: {
				feeRate: payload.platformFeeRate ?? 0.02,
			},
			...baseRef,
		});
	}

	return { entries, payoutAmount, platformFee };
};

export class PaymentService {
	private constructor() {}

	static createError(message: string, statusCode: number) {
		return new PaymentServiceError(message, statusCode);
	}

	static isServiceError(error: unknown): error is PaymentServiceError {
		return error instanceof PaymentServiceError;
	}

	static async holdEscrowForMilestone(payload: {
		milestoneId: string;
		submissionId: string;
		matchResultId: string;
		investorId: string;
		entrepreneurId: string;
		amount: number;
		currency: string;
	}) {
		if (payload.amount <= 0) {
			throw PaymentService.createError(
				"Escrow amount must be greater than zero",
				400,
			);
		}

		const event = await MockPaymentProvider.simulateEscrowHold({
			milestoneId: payload.milestoneId,
			amount: payload.amount,
			currency: payload.currency,
			investorId: payload.investorId,
			entrepreneurId: payload.entrepreneurId,
		});

		const ledgerEntry = await LedgerEntry.create({
			transactionId: randomUUID(),
			type: "escrow_hold",
			status: "completed",
			amount: payload.amount,
			currency: payload.currency,
			fromUserId: payload.investorId,
			toUserId: null,
			submissionId: payload.submissionId,
			matchResultId: payload.matchResultId,
			milestoneId: payload.milestoneId,
			provider: "mockpay",
			providerReference: event.providerReference,
			description: "Funds held in simulated escrow for milestone",
			referenceType: "milestone",
			referenceId: payload.milestoneId,
			metadata: {
				eventId: event.eventId,
				eventType: event.eventType,
			},
		});

		return {
			event,
			ledgerEntry,
		};
	}

	static async releaseMilestoneFunds(payload: {
		milestoneId: string;
		submissionId: string;
		matchResultId: string;
		investorId: string;
		entrepreneurId: string;
		amount: number;
		currency: string;
		platformFeeRate?: number;
	}) {
		if (payload.amount <= 0) {
			throw PaymentService.createError(
				"Release amount must be greater than zero",
				400,
			);
		}

		const event = await MockPaymentProvider.simulateMilestonePayout({
			milestoneId: payload.milestoneId,
			amount: payload.amount,
			currency: payload.currency,
			investorId: payload.investorId,
			entrepreneurId: payload.entrepreneurId,
		});

		const releaseEntry = await LedgerEntry.create({
			transactionId: randomUUID(),
			type: "escrow_release",
			status: "completed",
			amount: payload.amount,
			currency: payload.currency,
			fromUserId: null,
			toUserId: payload.entrepreneurId,
			submissionId: payload.submissionId,
			matchResultId: payload.matchResultId,
			milestoneId: payload.milestoneId,
			provider: "mockpay",
			providerReference: event.providerReference,
			description: "Escrow released for approved milestone",
			referenceType: "milestone",
			referenceId: payload.milestoneId,
			metadata: {
				eventId: event.eventId,
				eventType: "escrow.release.succeeded",
			},
		});

		const payout = buildMilestonePayoutLedgerEntries({
			milestoneId: payload.milestoneId,
			submissionId: payload.submissionId,
			matchResultId: payload.matchResultId,
			investorId: payload.investorId,
			entrepreneurId: payload.entrepreneurId,
			amount: payload.amount,
			currency: payload.currency,
			providerReference: event.providerReference,
			platformFeeRate: payload.platformFeeRate,
		});

		const payoutEntries = await LedgerEntry.create(payout.entries);

		return {
			event,
			releaseEntry,
			payoutEntries,
			payoutAmount: payout.payoutAmount,
			platformFee: payout.platformFee,
		};
	}

	/**
	 * Adapts the arrange_payment logic from the sample.
	 * Simplified for milestones: directly uses milestone amount.
	 */
	static async arrangePayment(payload: { type: string; milestoneId: string }) {
		const { type, milestoneId } = payload;

		if (type !== "milestone") {
			throw PaymentService.createError(
				"Only milestone payments are supported",
				400,
			);
		}

		const milestone = await Milestone.findById(milestoneId);
		if (!milestone) {
			throw PaymentService.createError("Milestone not found", 404);
		}

		return {
			success: true,
			amount: milestone.amount,
			currency: milestone.currency || "ETB",
			milestone,
		};
	}

	/**
	 * Generates a unique transaction reference using Chapa SDK or randomUUID.
	 */
	static async generateTxRef(): Promise<string> {
		if (chapa) {
			try {
				// @ts-expect-error
				return await chapa.genTxRef();
			} catch (error) {
				console.error(
					"Chapa genTxRef failed, falling back to randomUUID",
					error,
				);
			}
		}
		return `tx-${randomUUID().slice(0, 8)}-${Date.now()}`;
	}

	/**
	 * Verifies Chapa webhook signature for security.
	 */
	static verifyWebhookSignature(
		body: Record<string, unknown>,
		signature: string,
	): boolean {
		const secret = process.env.CHAPA_WEBHOOK_SECRET;
		if (!secret) {
			console.error("CHAPA_WEBHOOK_SECRET not set");
			return false;
		}

		const expected = createHmac("sha256", secret)
			.update(JSON.stringify(body))
			.digest("hex");

		return expected === signature;
	}

	/**
	 * Processes a successful Chapa payment.
	 * Updates milestone status to 'verified_paid' and logs the transaction.
	 * Ensures idempotency by checking PendingPayment status.
	 */
	static async processSuccessfulPayment(tx_ref: string, _chapaData: unknown) {
		const pending = await PendingPayment.findOne({ tx_ref });

		if (!pending) {
			console.error(`Pending payment not found for tx_ref: ${tx_ref}`);
			throw PaymentService.createError("Transaction not found", 404);
		}

		if (pending.status === "completed") {
			console.log(`Transaction ${tx_ref} already processed`);
			return { alreadyProcessed: true };
		}

		// Update pending payment status
		pending.status = "completed";
		await pending.save();

		const milestone = await Milestone.findById(pending.milestoneId);
		if (!milestone) {
			console.error(
				`Milestone ${pending.milestoneId} not found during webhook processing`,
			);
			throw PaymentService.createError("Milestone not found", 404);
		}

		// Update milestone status
		milestone.status = "verified_paid";
		milestone.verifiedAt = new Date();
		milestone.paymentReleasedAt = new Date();
		milestone.paymentReference = tx_ref;
		await milestone.save();

		// Record the transaction log
		await TransactionService.logTransaction({
			milestoneId: milestone._id.toString(),
			projectId: (milestone.projectId || milestone.submissionId).toString(),
			amount: milestone.amount,
			currency: milestone.currency,
			providerReference: tx_ref,
		});

		console.log(
			`Payment successfully processed for milestone ${milestone._id}`,
		);

		return { success: true, milestone };
	}
}
