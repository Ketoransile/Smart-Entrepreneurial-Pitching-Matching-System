import { type Document, model, Schema, type Types } from "mongoose";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export interface IInvitation extends Document {
	fromUserId: Types.ObjectId;
	toUserId: Types.ObjectId;
	matchResultId?: Types.ObjectId;
	submissionId?: Types.ObjectId;
	status: InvitationStatus;
	message?: string;
	expiresAt?: Date;
	respondedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
	{
		fromUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		toUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			default: null,
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"accepted",
				"declined",
				"expired",
			] satisfies InvitationStatus[],
			default: "pending",
		},
		message: {
			type: String,
			maxlength: 1000,
			default: null,
		},
		expiresAt: {
			type: Date,
			default: null,
		},
		respondedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

InvitationSchema.index({ toUserId: 1, status: 1 });
InvitationSchema.index({ fromUserId: 1, status: 1 });

export const Invitation = model<IInvitation>("Invitation", InvitationSchema);
