import { type Document, model, Schema } from "mongoose";

export type UserRole = "entrepreneur" | "investor" | "admin";

export interface IUser extends Document {
	firebaseUid: string;
	email: string;
	displayName: string;
	avatarUrl?: string;
	role: UserRole;
	isActive: boolean;
	isEmailVerified: boolean;
	lastLoginAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		firebaseUid: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		displayName: {
			type: String,
			required: true,
			trim: true,
		},
		avatarUrl: {
			type: String,
			default: null,
		},
		role: {
			type: String,
			enum: ["entrepreneur", "investor", "admin"] satisfies UserRole[],
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		lastLoginAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

UserSchema.index({ role: 1, isActive: 1 });

export const User = model<IUser>("User", UserSchema);
