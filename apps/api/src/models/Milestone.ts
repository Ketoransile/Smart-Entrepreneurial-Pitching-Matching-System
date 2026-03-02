import { type Document, model, Schema, type Types } from "mongoose";

export type MilestoneStatus =
	| "pending"
	| "in_progress"
	| "completed"
	| "missed";

export interface IMilestone extends Document {
	submissionId: Types.ObjectId;
	matchResultId?: Types.ObjectId;
	relatedMeetingId?: Types.ObjectId;
	createdBy: Types.ObjectId;
	title: string;
	description?: string;
	dueDate?: Date;
	completedAt?: Date;
	status: MilestoneStatus;
	createdAt: Date;
	updatedAt: Date;
}

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
			default: null,
		},
		relatedMeetingId: {
			type: Schema.Types.ObjectId,
			ref: "Meeting",
			default: null,
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
		dueDate: {
			type: Date,
			default: null,
		},
		completedAt: {
			type: Date,
			default: null,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"in_progress",
				"completed",
				"missed",
			] satisfies MilestoneStatus[],
			default: "pending",
		},
	},
	{ timestamps: true },
);

MilestoneSchema.index({ submissionId: 1, status: 1 });

export const Milestone = model<IMilestone>("Milestone", MilestoneSchema);
