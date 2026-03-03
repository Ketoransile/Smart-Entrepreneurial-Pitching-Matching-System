import { type Document, model, Schema, type Types } from "mongoose";

export type LedgerEntryType =
	| "subscription"
	| "platform_fee"
	| "refund"
	| "credit";

export type LedgerDirection = "debit" | "credit";

export type LedgerReferenceType =
	| "subscription"
	| "submission"
	| "meeting"
	| "other";

export interface ILedgerEntry extends Document {
	userId: Types.ObjectId;
	type: LedgerEntryType;
	amount: number;
	currency: string;
	direction: LedgerDirection;
	description: string;
	referenceId?: Types.ObjectId;
	referenceType?: LedgerReferenceType;
	balanceAfter: number;
	createdAt: Date;
	updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: [
				"subscription",
				"platform_fee",
				"refund",
				"credit",
			] satisfies LedgerEntryType[],
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			required: true,
			default: "USD",
			uppercase: true,
			trim: true,
		},
		direction: {
			type: String,
			enum: ["debit", "credit"] satisfies LedgerDirection[],
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		referenceId: {
			type: Schema.Types.ObjectId,
			default: null,
		},
		referenceType: {
			type: String,
			enum: [
				"subscription",
				"submission",
				"meeting",
				"other",
			] satisfies LedgerReferenceType[],
			default: null,
		},
		balanceAfter: {
			type: Number,
			required: true,
		},
	},
	{
		timestamps: true,
		// Immutable flag: prevent updates to existing ledger entries
		strict: true,
	},
);

LedgerEntrySchema.index({ userId: 1, createdAt: -1 });

export const LedgerEntry = model<ILedgerEntry>(
	"LedgerEntry",
	LedgerEntrySchema,
);
