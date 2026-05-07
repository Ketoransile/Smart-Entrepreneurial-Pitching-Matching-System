import mongoose, { type Document, Schema } from "mongoose";

export type EntityType =
	| "company_name"
	| "business_name"
	| "tin_number"
	| "tax_id"
	| "license_number"
	| "registration_number"
	| "person_name"
	| "address"
	| "date"
	| "email"
	| "phone"
	| "other";

export type EntitySource = "ocr" | "ai_extraction" | "manual" | "profile_sync";

export interface IExtractedEntity {
	value: string;
	confidence: number;
	source: EntitySource;
	position?: {
		page?: number;
		x?: number;
		y?: number;
		width?: number;
		height?: number;
	};
}

export interface IDocumentEntity extends Document {
	documentId: mongoose.Types.ObjectId;
	ownerId: mongoose.Types.ObjectId;
	submissionId?: mongoose.Types.ObjectId;
	entityType: EntityType;
	entities: IExtractedEntity[];
	canonicalValue?: string;
	verified: boolean;
	verifiedAt?: Date;
	verifiedBy?: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const ExtractedEntitySchema = new Schema<IExtractedEntity>(
	{
		value: { type: String, required: true, trim: true },
		confidence: {
			type: Number,
			required: true,
			min: 0,
			max: 1,
			default: 0.5,
		},
		source: {
			type: String,
			enum: ["ocr", "ai_extraction", "manual", "profile_sync"],
			required: true,
			default: "ai_extraction",
		},
		position: {
			page: Number,
			x: Number,
			y: Number,
			width: Number,
			height: Number,
		},
	},
	{ _id: false },
);

const DocumentEntitySchema = new Schema<IDocumentEntity>(
	{
		documentId: {
			type: Schema.Types.ObjectId,
			ref: "Document",
			required: true,
			index: true,
		},
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
		entityType: {
			type: String,
			enum: [
				"company_name",
				"business_name",
				"tin_number",
				"tax_id",
				"license_number",
				"registration_number",
				"person_name",
				"address",
				"date",
				"email",
				"phone",
				"other",
			],
			required: true,
			index: true,
		},
		entities: [ExtractedEntitySchema],
		canonicalValue: {
			type: String,
			trim: true,
			index: true,
		},
		verified: {
			type: Boolean,
			default: false,
		},
		verifiedAt: Date,
		verifiedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{ timestamps: true },
);

// Compound indexes for efficient conflict detection queries
DocumentEntitySchema.index({ ownerId: 1, entityType: 1, canonicalValue: 1 });
DocumentEntitySchema.index({ submissionId: 1, entityType: 1 });
DocumentEntitySchema.index({ documentId: 1, entityType: 1 }, { unique: true });

export const DocumentEntity = mongoose.model<IDocumentEntity>(
	"DocumentEntity",
	DocumentEntitySchema,
);
