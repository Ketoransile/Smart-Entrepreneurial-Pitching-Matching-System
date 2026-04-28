import { createHmac, randomUUID } from "node:crypto";

export type MockPaymentEventType =
	| "escrow.hold.succeeded"
	| "escrow.release.succeeded"
	| "milestone.payout.succeeded";

export interface MockPaymentEvent<TMetadata extends Record<string, unknown>> {
	eventId: string;
	eventType: MockPaymentEventType;
	providerReference: string;
	status: "completed";
	processedAt: string;
	metadata: TMetadata;
}

export const buildMockProviderReference = (prefix: string) => {
	return `${prefix}_${Date.now()}_${randomUUID().slice(0, 8)}`;
};

export const signMockWebhookPayload = (payload: string, secret: string) => {
	return createHmac("sha256", secret).update(payload).digest("hex");
};

export const verifyMockWebhookSignature = (
	payload: string,
	signature: string,
	secret: string,
) => {
	if (!signature || !secret) {
		return false;
	}
	const expected = signMockWebhookPayload(payload, secret);
	return expected === signature;
};

export const MockPaymentProvider = {
	async simulateEscrowHold(payload: {
		milestoneId: string;
		amount: number;
		currency: string;
		investorId: string;
		entrepreneurId: string;
	}) {
		const providerReference = buildMockProviderReference("escrow_hold");
		const event: MockPaymentEvent<typeof payload> = {
			eventId: randomUUID(),
			eventType: "escrow.hold.succeeded",
			providerReference,
			status: "completed",
			processedAt: new Date().toISOString(),
			metadata: payload,
		};

		return event;
	},

	async simulateMilestonePayout(payload: {
		milestoneId: string;
		amount: number;
		currency: string;
		investorId: string;
		entrepreneurId: string;
	}) {
		const providerReference = buildMockProviderReference("milestone_payout");
		const event: MockPaymentEvent<typeof payload> = {
			eventId: randomUUID(),
			eventType: "milestone.payout.succeeded",
			providerReference,
			status: "completed",
			processedAt: new Date().toISOString(),
			metadata: payload,
		};

		return event;
	},
};
