import { type Document, model, Schema, type Types } from "mongoose";

export type PaymentStatus = "pending" | "completed" | "failed";

export interface IPendingPayment extends Document {
	tx_ref: string;
	status: PaymentStatus;
	amount: number;
	currency: string;
	userId: Types.ObjectId;
	milestoneId: Types.ObjectId;
	meta?: Record<string, unknown>;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const PendingPaymentSchema = new Schema<IPendingPayment>(
	{
		tx_ref: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed"],
			default: "pending",
		},
		amount: {
			type: Number,
			required: true,
		},
		currency: {
			type: String,
			default: "ETB",
		},
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		milestoneId: {
			type: Schema.Types.ObjectId,
			ref: "Milestone",
			required: true,
		},
		meta: {
			type: Schema.Types.Mixed,
			default: {},
		},
		expiresAt: {
			type: Date,
			default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
			index: { expires: 0 }, // TTL index
		},
	},
	{ timestamps: true },
);

export const PendingPayment = model<IPendingPayment>(
	"PendingPayment",
	PendingPaymentSchema,
);
