import { type Document, model, Schema, type Types } from "mongoose";

export interface IAdminProfile extends Document {
	userId: Types.ObjectId;
	department?: string;
	permissions: string[];
	createdAt: Date;
	updatedAt: Date;
}

const AdminProfileSchema = new Schema<IAdminProfile>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
			index: true,
		},
		department: {
			type: String,
			trim: true,
			default: null,
		},
		permissions: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true },
);

export const AdminProfile = model<IAdminProfile>(
	"AdminProfile",
	AdminProfileSchema,
);
