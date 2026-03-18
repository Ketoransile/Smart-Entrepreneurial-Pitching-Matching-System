import { type Document, model, Schema, type Types } from "mongoose";

export interface ISystemConfig extends Document {
	key: string;
	value: Record<string, unknown>;
	description?: string;
	updatedBy?: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
	{
		key: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		value: {
			type: Schema.Types.Mixed,
			required: true,
			default: {},
		},
		description: {
			type: String,
			default: null,
			maxlength: 1000,
		},
		updatedBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
	},
	{ timestamps: true },
);

export const SystemConfig = model<ISystemConfig>(
	"SystemConfig",
	SystemConfigSchema,
);
