import { type Document, model, Schema, type Types } from "mongoose";

export type MilestoneStatus =
	| "pending"
	| "in_progress"
	| "submitted_for_review"
	| "verified_paid"
	| "rejected"
	| "cancelled";

export type MilestoneEscrowStatus =
	| "not_held"
	| "held"
	| "released"
	| "refunded";

export interface IMilestoneEvidenceDocument {
	name: string;
	url: string;
	type: "invoice" | "report" | "delivery_note" | "photo" | "video" | "other";
	uploadedAt: Date;
}

export interface IMilestone extends Document {
	submissionId: Types.ObjectId;
	matchResultId: Types.ObjectId;
	entrepreneurId: Types.ObjectId;
	investorId: Types.ObjectId;
	createdBy: Types.ObjectId;
	title: string;
	description?: string;
	amount: number;
	currency: string;
	dueDate: Date;
	evidenceDocuments: IMilestoneEvidenceDocument[];
	submittedAt?: Date;
	verifiedAt?: Date;
	verifiedBy?: Types.ObjectId;
	verificationNotes?: string;
	escrowStatus: MilestoneEscrowStatus;
	escrowReference?: string;
	paymentReleasedAt?: Date;
	paymentReference?: string;
	status: MilestoneStatus;
	// Simplified workflow fields
	projectId?: Types.ObjectId;
	proof?: string;
	feedback?: string;
	createdAt: Date;
	updatedAt: Date;
}

const milestoneEvidenceSchema = new Schema<IMilestoneEvidenceDocument>(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		url: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			enum: ["invoice", "report", "delivery_note", "photo", "video", "other"],
			default: "other",
		},
		uploadedAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
	},
	{ _id: false },
);

const MilestoneSchema = new Schema<IMilestone>(
	{
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			required: true,
			index: true,
		},
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			required: true,
			index: true,
		},
		entrepreneurId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		investorId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			maxlength: 2000,
			default: null,
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
		dueDate: {
			type: Date,
			required: true,
		},
		evidenceDocuments: {
			type: [milestoneEvidenceSchema],
			default: [],
		},
		submittedAt: {
			type: Date,
			default: null,
		},
		verifiedAt: {
			type: Date,
			default: null,
		},
		verifiedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		verificationNotes: {
			type: String,
			maxlength: 2000,
			default: null,
		},
		escrowStatus: {
			type: String,
			enum: [
				"not_held",
				"held",
				"released",
				"refunded",
			] satisfies MilestoneEscrowStatus[],
			default: "not_held",
		},
		escrowReference: {
			type: String,
			default: null,
		},
		paymentReleasedAt: {
			type: Date,
			default: null,
		},
		paymentReference: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"in_progress",
				"submitted_for_review",
				"verified_paid",
				"rejected",
				"cancelled",
			] satisfies MilestoneStatus[],
			default: "pending",
		},
		// Simplified workflow fields
		projectId: {
			type: Schema.Types.ObjectId,
			default: null,
			index: true,
		},
		proof: {
			type: String,
			default: null,
		},
		feedback: {
			type: String,
			maxlength: 2000,
			default: null,
		},
	},
	{ timestamps: true },
);

MilestoneSchema.index({ submissionId: 1, status: 1 });
MilestoneSchema.index({ matchResultId: 1, status: 1 });
MilestoneSchema.index({ dueDate: 1, status: 1 });

export const Milestone = model<IMilestone>("Milestone", MilestoneSchema);
