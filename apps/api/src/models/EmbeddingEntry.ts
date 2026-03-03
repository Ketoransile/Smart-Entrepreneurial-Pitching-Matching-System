import { type Document, model, Schema, type Types } from "mongoose";

export type EmbeddingTargetType =
	| "submission"
	| "entrepreneurProfile"
	| "investorProfile";

export interface IEmbeddingEntry extends Document {
	targetId: Types.ObjectId;
	targetType: EmbeddingTargetType;
	modelVersion: string;
	vector: number[];
	generatedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const EmbeddingEntrySchema = new Schema<IEmbeddingEntry>(
	{
		targetId: {
			type: Schema.Types.ObjectId,
			required: true,
		},
		targetType: {
			type: String,
			enum: [
				"submission",
				"entrepreneurProfile",
				"investorProfile",
			] satisfies EmbeddingTargetType[],
			required: true,
		},
		modelVersion: {
			type: String,
			required: true,
			trim: true,
		},
		vector: {
			type: [Number],
			required: true,
		},
		generatedAt: {
			type: Date,
			required: true,
			default: () => new Date(),
		},
	},
	{ timestamps: true },
);

EmbeddingEntrySchema.index({ targetId: 1, targetType: 1 });
// Latest embedding per target (for dedup / refresh)
EmbeddingEntrySchema.index(
	{ targetId: 1, targetType: 1, modelVersion: 1 },
	{ unique: true },
);

export const EmbeddingEntry = model<IEmbeddingEntry>(
	"EmbeddingEntry",
	EmbeddingEntrySchema,
);
