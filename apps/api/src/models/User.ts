import { type Document, model, Schema } from "mongoose";

export type UserRole = "entrepreneur" | "investor" | "admin";

export interface IUser extends Document {
	firebaseUid: string;
	email: string;
	fullName: string;
	photoURL?: string;
	role: UserRole;
	status: "unverified" | "pending" | "verified" | "suspended";
	isActive: boolean;
	emailVerified: boolean;
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
		fullName: {
			type: String,
			required: true,
			trim: true,
		},
		photoURL: {
			type: String,
			default: null,
		},
		role: {
			type: String,
			enum: ["entrepreneur", "investor", "admin"] satisfies UserRole[],
			required: true,
		},
		status: {
			type: String,
			enum: ["unverified", "pending", "verified", "suspended"],
			default: "unverified",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		emailVerified: {
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
