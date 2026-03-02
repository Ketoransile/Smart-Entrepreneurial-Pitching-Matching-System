import { type Document, model, Schema, type Types } from "mongoose";

export type TagTargetType =
	| "submission"
	| "entrepreneurProfile"
	| "investorProfile";

export interface ITagAssignment extends Document {
	tagId: Types.ObjectId;
	targetId: Types.ObjectId;
	targetType: TagTargetType;
	createdAt: Date;
	updatedAt: Date;
}

const TagAssignmentSchema = new Schema<ITagAssignment>(
	{
		tagId: {
			type: Schema.Types.ObjectId,
			ref: "Tag",
			required: true,
		},
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
			] satisfies TagTargetType[],
			required: true,
		},
	},
	{ timestamps: true },
);

// Prevent duplicate assignments; also serves as the primary lookup index
TagAssignmentSchema.index(
	{ tagId: 1, targetId: 1, targetType: 1 },
	{ unique: true },
);
TagAssignmentSchema.index({ targetId: 1, targetType: 1 });

export const TagAssignment = model<ITagAssignment>(
	"TagAssignment",
	TagAssignmentSchema,
);
