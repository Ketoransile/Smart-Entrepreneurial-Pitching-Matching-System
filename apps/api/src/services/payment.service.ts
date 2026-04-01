import { randomUUID } from "node:crypto";

import { LedgerEntry } from "../models/LedgerEntry";
import { MockPaymentProvider } from "./mock-payment.provider";

class PaymentServiceError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.name = "PaymentServiceError";
		this.statusCode = statusCode;
	}
}

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
}
