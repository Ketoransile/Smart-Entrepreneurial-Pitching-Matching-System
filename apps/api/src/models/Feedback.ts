import { type Document, model, Schema, type Types } from "mongoose";

export type FeedbackCategory =
	| "overall"
	| "communication"
	| "professionalism"
	| "pitch_quality"
	| "collaboration";

export interface IFeedback extends Document {
	invitationId?: Types.ObjectId;
	matchResultId?: Types.ObjectId;
	submissionId?: Types.ObjectId;
	fromUserId: Types.ObjectId;
	toUserId: Types.ObjectId;
	rating: number;
	category: FeedbackCategory;
	comment?: string;
	createdAt: Date;
	updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
	{
		invitationId: {
			type: Schema.Types.ObjectId,
			ref: "Invitation",
			default: null,
			index: true,
		},
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			default: null,
			index: true,
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
			index: true,
		},
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
			validate: {
				validator: function validateRecipient(
					this: IFeedback,
					value: Types.ObjectId,
				) {
					return this.fromUserId.toString() !== value.toString();
				},
				message: "You cannot leave feedback for yourself",
			},
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		category: {
			type: String,
			enum: [
				"overall",
				"communication",
				"professionalism",
				"pitch_quality",
				"collaboration",
			] satisfies FeedbackCategory[],
			default: "overall",
		},
		comment: {
			type: String,
			default: null,
			maxlength: 2500,
		},
	},
	{ timestamps: true },
);

FeedbackSchema.index({ toUserId: 1, createdAt: -1 });
FeedbackSchema.index({ fromUserId: 1, createdAt: -1 });
FeedbackSchema.index(
	{ invitationId: 1, fromUserId: 1 },
	{
		unique: true,
		partialFilterExpression: { invitationId: { $exists: true, $ne: null } },
	},
);

export const Feedback = model<IFeedback>("Feedback", FeedbackSchema);
