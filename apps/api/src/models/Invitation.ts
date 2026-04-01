import { type Document, model, Schema, type Types } from "mongoose";

export type InvitationStatus =
	| "pending"
	| "accepted"
	| "declined"
	| "cancelled"
	| "expired";

export interface IInvitation extends Document {
	matchResultId: Types.ObjectId;
	submissionId?: Types.ObjectId;
	entrepreneurId: Types.ObjectId;
	investorId: Types.ObjectId;
	senderId: Types.ObjectId;
	receiverId: Types.ObjectId;
	message?: string;
	responseMessage?: string;
	status: InvitationStatus;
	sentAt: Date;
	respondedAt?: Date;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
	{
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			required: true,
			index: true,
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
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
		senderId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			validate: {
				validator: function validateReceiver(
					this: IInvitation,
					value: Types.ObjectId,
				) {
					return this.senderId.toString() !== value.toString();
				},
				message: "Sender and receiver cannot be the same user",
			},
		},
		message: {
			type: String,
			default: null,
			maxlength: 1200,
		},
		responseMessage: {
			type: String,
			default: null,
			maxlength: 1200,
		},
		status: {
			type: String,
			enum: [
				"pending",
				"accepted",
				"declined",
				"cancelled",
				"expired",
			] satisfies InvitationStatus[],
			default: "pending",
		},
		sentAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
		respondedAt: {
			type: Date,
			default: null,
		},
		expiresAt: {
			type: Date,
			required: true,
			default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
		},
	},
	{ timestamps: true },
);

InvitationSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
InvitationSchema.index({ senderId: 1, status: 1, createdAt: -1 });
InvitationSchema.index(
	{ matchResultId: 1, senderId: 1, receiverId: 1, status: 1 },
	{
		unique: true,
		partialFilterExpression: { status: "pending" },
	},
);

export const Invitation = model<IInvitation>("Invitation", InvitationSchema);
