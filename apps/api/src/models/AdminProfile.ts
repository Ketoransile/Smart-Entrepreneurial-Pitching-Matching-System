import mongoose, { type Document, Schema } from "mongoose";

export interface IAdminProfile extends Document {
	userId: mongoose.Types.ObjectId;
	fullName: string;
	profilePicture?: string;
	department: string;
	permissionLevel: "super" | "moderator" | "support";
	lastActive: Date;
	actionsPerformed: number;
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

		fullName: { type: String, required: true },
		profilePicture: String,

		department: { type: String, required: true },
		permissionLevel: {
			type: String,
			enum: ["super", "moderator", "support"],
			default: "moderator",
		},

		lastActive: { type: Date, default: Date.now },
		actionsPerformed: { type: Number, default: 0 },
	},
	{
		timestamps: true,
	},
);

export const AdminProfile = mongoose.model<IAdminProfile>(
	"AdminProfile",
	AdminProfileSchema,
);
