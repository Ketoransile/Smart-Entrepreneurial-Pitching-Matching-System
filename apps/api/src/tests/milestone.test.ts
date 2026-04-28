import mongoose from "mongoose";

import { LedgerEntry } from "../models/LedgerEntry";
import { Milestone } from "../models/Milestone";
import {
	canManageMilestone,
	canVerifyMilestone,
	normalizeEvidenceDocuments,
} from "../services/milestone.service";
import {
	signMockWebhookPayload,
	verifyMockWebhookSignature,
} from "../services/mock-payment.provider";
import {
	buildMilestonePayoutLedgerEntries,
	calculatePlatformFee,
} from "../services/payment.service";

describe("Milestone and payment simulation", () => {
	it("creates milestone with expected defaults", () => {
		const milestone = new Milestone({
			submissionId: new mongoose.Types.ObjectId(),
			matchResultId: new mongoose.Types.ObjectId(),
			entrepreneurId: new mongoose.Types.ObjectId(),
			investorId: new mongoose.Types.ObjectId(),
			createdBy: new mongoose.Types.ObjectId(),
			title: "Build MVP checkout flow",
			amount: 25000,
			currency: "ETB",
			dueDate: new Date("2026-06-01T00:00:00.000Z"),
		});

		expect(milestone.status).toBe("pending");
		expect(milestone.escrowStatus).toBe("not_held");
		expect(milestone.evidenceDocuments).toEqual([]);
	});

	it("accepts new ledger entry types for milestone flow", () => {
		const ledger = new LedgerEntry({
			transactionId: "txn_test_1",
			type: "escrow_hold",
			status: "completed",
			amount: 25000,
			currency: "USD",
			provider: "mockpay",
			description: "Escrow hold",
			occurredAt: new Date(),
		});

		expect(ledger.validateSync()).toBeUndefined();
	});

	it("normalizes evidence docs and drops invalid entries", () => {
		const docs = normalizeEvidenceDocuments([
			{
				name: "Invoice #1",
				url: "https://example.com/invoice.pdf",
				type: "invoice",
			},
			{ name: "", url: "https://example.com/empty-name.pdf" },
			{ name: "Photo", url: "https://example.com/photo.jpg", type: "photo" },
		]);

		expect(docs.length).toBe(2);
		expect(docs[0]?.type).toBe("invoice");
		expect(docs[1]?.type).toBe("photo");
	});

	it("applies role checks for milestone management and verification", () => {
		expect(
			canManageMilestone({
				milestoneEntrepreneurId: "ent-1",
				milestoneInvestorId: "inv-1",
				actorId: "ent-1",
				actorRole: "entrepreneur",
			}),
		).toBe(true);

		expect(
			canManageMilestone({
				milestoneEntrepreneurId: "ent-1",
				milestoneInvestorId: "inv-1",
				actorId: "inv-1",
				actorRole: "investor",
			}),
		).toBe(true);

		expect(
			canVerifyMilestone({
				milestoneInvestorId: "inv-1",
				actorId: "inv-1",
				actorRole: "investor",
			}),
		).toBe(true);

		expect(
			canVerifyMilestone({
				milestoneInvestorId: "inv-1",
				actorId: "ent-1",
				actorRole: "entrepreneur",
			}),
		).toBe(false);
	});

	it("builds payout ledger entries with platform fee", () => {
		const fee = calculatePlatformFee(1000, 0.02);
		expect(fee).toBe(20);

		const payout = buildMilestonePayoutLedgerEntries({
			milestoneId: "milestone-1",
			submissionId: "submission-1",
			matchResultId: "match-1",
			investorId: "inv-1",
			entrepreneurId: "ent-1",
			amount: 1000,
			currency: "USD",
			providerReference: "mock_ref_123",
			platformFeeRate: 0.02,
		});

		expect(payout.payoutAmount).toBe(980);
		expect(payout.platformFee).toBe(20);
		expect(payout.entries.length).toBe(2);
	});

	it("verifies mock webhook signatures", () => {
		const payload = JSON.stringify({
			event: "milestone.payout.succeeded",
			amount: 980,
		});
		const secret = "phase10_secret";
		const signature = signMockWebhookPayload(payload, secret);

		expect(verifyMockWebhookSignature(payload, signature, secret)).toBe(true);
		expect(verifyMockWebhookSignature(payload, "bad_signature", secret)).toBe(
			false,
		);
	});
});
