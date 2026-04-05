import { type Document, model, Schema, type Types } from "mongoose";

export interface IConversation extends Document {
	participants: Types.ObjectId[];
	title?: string;
	isGroup?: boolean;
	matchResultId?: Types.ObjectId;
	submissionId?: Types.ObjectId;
	lastMessageAt?: Date;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
	{
		participants: {
			type: [Schema.Types.ObjectId],
			ref: "User",
			required: true,
			validate: {
				validator: (arr: Types.ObjectId[]) => arr.length >= 2,
				message: "A conversation must have at least 2 participants.",
			},
		},
		title: {
			type: String,
			default: null,
		},
		isGroup: {
			type: Boolean,
			default: false,
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
		lastMessageAt: {
			type: Date,
			default: null,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

export const Conversation = model<IConversation>(
	"Conversation",
	ConversationSchema,
);
