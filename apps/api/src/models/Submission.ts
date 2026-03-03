import { type Document, model, Schema, type Types } from "mongoose";
import type { StartupStage } from "./EntrepreneurProfile";

export type SubmissionStatus =
	| "draft"
	| "submitted"
	| "under_review"
	| "matched"
	| "rejected"
	| "closed";

export interface ISubmission extends Document {
	entrepreneurId: Types.ObjectId;
	title: string;
	summary: string;
	industry: string;
	stage: StartupStage;
	fundingGoal?: number;
	currency: string;
	status: SubmissionStatus;
	reviewNotes?: string;
	submittedAt?: Date;
	closedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
	{
		entrepreneurId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		summary: {
			type: String,
			required: true,
			maxlength: 3000,
		},
		industry: {
			type: String,
			required: true,
			trim: true,
		},
		stage: {
			type: String,
			enum: ["idea", "mvp", "growth", "scaling"] satisfies StartupStage[],
			required: true,
		},
		fundingGoal: {
			type: Number,
			min: 0,
			default: null,
		},
		currency: {
			type: String,
			default: "USD",
			uppercase: true,
			trim: true,
		},
		status: {
			type: String,
			enum: [
				"draft",
				"submitted",
				"under_review",
				"matched",
				"rejected",
				"closed",
			] satisfies SubmissionStatus[],
			default: "draft",
		},
		reviewNotes: {
			type: String,
			default: null,
		},
		submittedAt: {
			type: Date,
			default: null,
		},
		closedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

SubmissionSchema.index({ status: 1, industry: 1 });
SubmissionSchema.index({ entrepreneurId: 1, status: 1 });

export const Submission = model<ISubmission>("Submission", SubmissionSchema);
