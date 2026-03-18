import { type Document, model, Schema } from "mongoose";

export interface IAdminInvite extends Document {
	token: string;
	email?: string;
	fullName?: string;
	createdBy: string;
	used: boolean;
	usedBy?: string;
	expiresAt: Date;
	createdAt: Date;
}

const AdminInviteSchema = new Schema<IAdminInvite>(
	{
		token: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		email: {
			type: String,
			default: null,
			lowercase: true,
			trim: true,
		},
		fullName: {
			type: String,
			default: null,
			trim: true,
		},
		createdBy: {
			type: String,
			required: true,
		},
		used: {
			type: Boolean,
			default: false,
		},
		usedBy: {
			type: String,
			default: null,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true },
);

// Auto-delete expired invites after 24h
AdminInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AdminInvite = model<IAdminInvite>(
	"AdminInvite",
	AdminInviteSchema,
);
