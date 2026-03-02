import { type Document, model, Schema, type Types } from "mongoose";

export type MessageType = "text" | "file";

export interface IReadReceipt {
	userId: Types.ObjectId;
	readAt: Date;
}

export interface IMessage extends Document {
	conversationId: Types.ObjectId;
	senderId: Types.ObjectId;
	body: string;
	type: MessageType;
	attachmentUrl?: string;
	readBy: IReadReceipt[];
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const ReadReceiptSchema = new Schema<IReadReceipt>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		readAt: {
			type: Date,
			required: true,
		},
	},
	{ _id: false },
);

const MessageSchema = new Schema<IMessage>(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: "Conversation",
			required: true,
			index: true,
		},
		senderId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		body: {
			type: String,
			required: true,
			maxlength: 5000,
		},
		type: {
			type: String,
			enum: ["text", "file"] satisfies MessageType[],
			default: "text",
		},
		attachmentUrl: {
			type: String,
			default: null,
		},
		readBy: {
			type: [ReadReceiptSchema],
			default: [],
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = model<IMessage>("Message", MessageSchema);
