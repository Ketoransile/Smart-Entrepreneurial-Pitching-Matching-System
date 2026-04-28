import { type Document, model, Schema, type Types } from "mongoose";

export interface ITransactionLog extends Document {
	milestoneId: Types.ObjectId;
	projectId: Types.ObjectId; // maps to submissionId / matchResultId context
	amount: number;
	currency: string;
	status: "simulated" | "real";
	providerReference?: string;
	processedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const TransactionLogSchema = new Schema<ITransactionLog>(
	{
		milestoneId: {
			type: Schema.Types.ObjectId,
			ref: "Milestone",
			required: true,
			index: true,
		},
		projectId: {
			type: Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0.01,
		},
		currency: {
			type: String,
			required: true,
			default: "ETB",
			uppercase: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ["simulated", "real"],
			default: "real",
			required: true,
		},
		providerReference: {
			type: String,
			default: null,
		},
		processedAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
	},
	{ timestamps: true },
);

TransactionLogSchema.index({ projectId: 1, createdAt: -1 });
TransactionLogSchema.index({ milestoneId: 1, createdAt: -1 });

export const TransactionLog = model<ITransactionLog>(
	"TransactionLog",
	TransactionLogSchema,
);
