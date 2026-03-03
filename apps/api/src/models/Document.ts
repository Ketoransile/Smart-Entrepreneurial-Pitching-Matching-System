import { type Document, model, Schema, type Types } from "mongoose";

export type DocumentType = "pitch_deck" | "financial_model" | "legal" | "other";

export interface IDocument extends Document {
	ownerId: Types.ObjectId;
	submissionId?: Types.ObjectId;
	type: DocumentType;
	filename: string;
	cloudinaryPublicId: string;
	url: string;
	sizeBytes: number;
	mimeType: string;
	createdAt: Date;
	updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
	{
		ownerId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		submissionId: {
			type: Schema.Types.ObjectId,
			ref: "Submission",
			default: null,
			index: true,
		},
		type: {
			type: String,
			enum: [
				"pitch_deck",
				"financial_model",
				"legal",
				"other",
			] satisfies DocumentType[],
			required: true,
		},
		filename: {
			type: String,
			required: true,
			trim: true,
		},
		cloudinaryPublicId: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		sizeBytes: {
			type: Number,
			required: true,
			min: 0,
		},
		mimeType: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true },
);

export const DocumentModel = model<IDocument>("Document", DocumentSchema);
