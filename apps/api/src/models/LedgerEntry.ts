import { type Document, model, Schema, type Types } from "mongoose";

export type LedgerEntryType =
	| "escrow_hold"
	| "escrow_release"
	| "milestone_payout"
	| "milestone_refund"
	| "platform_fee"
	| "adjustment";

export type LedgerEntryStatus = "pending" | "completed" | "failed";

export type LedgerReferenceType =
	| "submission"
	| "match"
	| "milestone"
	| "other";

export interface ILedgerEntry extends Document {
	transactionId: string;
	type: LedgerEntryType;
	status: LedgerEntryStatus;
	amount: number;
	currency: string;
	fromUserId?: Types.ObjectId;
	toUserId?: Types.ObjectId;
	submissionId?: Types.ObjectId;
	matchResultId?: Types.ObjectId;
	milestoneId?: Types.ObjectId;
	provider: "mockpay";
	providerReference?: string;
	description: string;
	referenceType?: LedgerReferenceType;
	referenceId?: Types.ObjectId;
	metadata?: Record<string, unknown>;
	occurredAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
	{
		transactionId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		type: {
			type: String,
			enum: [
				"escrow_hold",
				"escrow_release",
				"milestone_payout",
				"milestone_refund",
				"platform_fee",
				"adjustment",
			] satisfies LedgerEntryType[],
			required: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed"] satisfies LedgerEntryStatus[],
			required: true,
			default: "completed",
		},
		amount: {
			type: Number,
			required: true,
			min: 0.01,
		},
		currency: {
			type: String,
			required: true,
			default: "USD",
			uppercase: true,
			trim: true,
		},
		fromUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
			index: true,
		},
		toUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
			index: true,
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
			index: true,
		},
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			default: null,
			index: true,
		},
		milestoneId: {
			type: Schema.Types.ObjectId,
			ref: "Milestone",
			default: null,
			index: true,
		},
		provider: {
			type: String,
			enum: ["mockpay"],
			required: true,
			default: "mockpay",
		},
		providerReference: {
			type: String,
			default: null,
		},
		referenceType: {
			type: String,
			enum: [
				"submission",
				"match",
				"milestone",
				"other",
			] satisfies LedgerReferenceType[],
			default: null,
		},
		referenceId: {
			type: Schema.Types.ObjectId,
			default: null,
		},
		description: {
			type: String,
			required: true,
		},
		metadata: {
			type: Schema.Types.Mixed,
			default: null,
		},
		occurredAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
	},
	{
		timestamps: true,
		strict: true,
	},
);

const immutableMessage = "Ledger entries are immutable and cannot be modified.";
LedgerEntrySchema.pre(
	[
		"updateOne",
		"updateMany",
		"findOneAndUpdate",
		"findByIdAndUpdate",
		"replaceOne",
		"deleteOne",
		"deleteMany",
		"findOneAndDelete",
		"findByIdAndDelete",
	],
	function immutableGuard(next) {
		next(new Error(immutableMessage));
	},
);

LedgerEntrySchema.index({ milestoneId: 1, createdAt: -1 });
LedgerEntrySchema.index({ fromUserId: 1, createdAt: -1 });
LedgerEntrySchema.index({ toUserId: 1, createdAt: -1 });
LedgerEntrySchema.index({ referenceType: 1, referenceId: 1 });

export const LedgerEntry = model<ILedgerEntry>(
	"LedgerEntry",
	LedgerEntrySchema,
);
