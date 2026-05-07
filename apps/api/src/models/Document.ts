import {
	type Document as MongooseDocument,
	model,
	Schema,
	type Types,
} from "mongoose";

export type DocumentType =
	| "pitch_deck"
	| "financial_model"
	| "product_demo"
	| "customer_testimonials"
	| "other";
export type DocumentProcessingStatus =
	| "uploaded"
	| "processing"
	| "processed"
	| "failed"
	| "flagged"
	| "conflict_detected";

export type ConflictCheckStatus =
	| "pending"
	| "passed"
	| "failed"
	| "manual_review";

export interface IDocument extends MongooseDocument {
	ownerId: Types.ObjectId;
	submissionId?: Types.ObjectId;
	type: DocumentType;
	filename: string;
	cloudinaryPublicId: string;
	url: string;
	sizeBytes: number;
	mimeType: string;
	status: DocumentProcessingStatus;
	extractedText?: string;
	aiSummary?: string;
	aiTags: string[];
	aiConfidence?: number;
	processingError?: string;
	processedAt?: Date;
	// UC-13: Conflict Detection fields
	conflictCheckStatus?: ConflictCheckStatus;
	conflictsDetected?: string[];
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
				"product_demo",
				"customer_testimonials",
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
		status: {
			type: String,
			enum: [
				"uploaded",
				"processing",
				"processed",
				"failed",
				"flagged",
				"conflict_detected",
			] satisfies DocumentProcessingStatus[],
			default: "uploaded",
			index: true,
		},
		extractedText: {
			type: String,
			default: null,
		},
		aiSummary: {
			type: String,
			default: null,
		},
		aiTags: {
			type: [String],
			default: [],
		},
		aiConfidence: {
			type: Number,
			default: null,
			min: 0,
			max: 1,
		},
		processingError: {
			type: String,
			default: null,
		},
		processedAt: {
			type: Date,
			default: null,
		},
		// UC-13: Conflict Detection fields
		conflictCheckStatus: {
			type: String,
			enum: ["pending", "passed", "failed", "manual_review"],
			default: "pending",
			index: true,
		},
		conflictsDetected: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true },
);

DocumentSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

export const DocumentModel = model<IDocument>("Document", DocumentSchema);
export const Document = DocumentModel;
