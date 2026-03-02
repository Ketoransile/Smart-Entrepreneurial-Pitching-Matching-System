import { type Document, model, Schema } from "mongoose";

export type TagCategory = "industry" | "stage" | "technology" | "other";

export interface ITag extends Document {
	name: string;
	category: TagCategory;
	createdAt: Date;
	updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		category: {
			type: String,
			enum: [
				"industry",
				"stage",
				"technology",
				"other",
			] satisfies TagCategory[],
			required: true,
		},
	},
	{ timestamps: true },
);

TagSchema.index({ category: 1 });

export const Tag = model<ITag>("Tag", TagSchema);
