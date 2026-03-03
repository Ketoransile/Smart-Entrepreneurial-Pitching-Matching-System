import { type Document, model, Schema, type Types } from "mongoose";

export interface IFeedback extends Document {
	fromUserId: Types.ObjectId;
	toUserId: Types.ObjectId;
	submissionId?: Types.ObjectId;
	meetingId?: Types.ObjectId;
	matchResultId?: Types.ObjectId;
	rating: number;
	comment?: string;
	isAnonymous: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
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
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
		},
		meetingId: {
			type: Schema.Types.ObjectId,
			ref: "Meeting",
			default: null,
		},
		matchResultId: {
			type: Schema.Types.ObjectId,
			ref: "MatchResult",
			default: null,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		comment: {
			type: String,
			maxlength: 2000,
			default: null,
		},
		isAnonymous: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

FeedbackSchema.index({ toUserId: 1, createdAt: -1 });
// One feedback per from/to/submission combo to prevent spam
FeedbackSchema.index(
	{ fromUserId: 1, toUserId: 1, submissionId: 1 },
	{ unique: true, sparse: true },
);

export const Feedback = model<IFeedback>("Feedback", FeedbackSchema);
