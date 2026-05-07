import { type Document, model, Schema, type Types } from "mongoose";

export type OtpChannel = "email" | "sms";
export type OtpPurpose = "verify" | "password_reset";

export interface IOtp extends Document {
	userId?: Types.ObjectId;
	identifier: string;
	channel: OtpChannel;
	purpose: OtpPurpose;
	codeHash: string;
	attempts: number;
	maxAttempts: number;
	expiresAt: Date;
	consumedAt?: Date | null;
	requestedIp?: string | null;
	userAgent?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: false,
		},
		identifier: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		channel: {
			type: String,
			enum: ["email", "sms"],
			required: true,
		},
		purpose: {
			type: String,
			enum: ["verify", "password_reset"],
			required: true,
		},
		codeHash: {
			type: String,
			required: true,
		},
		attempts: {
			type: Number,
			default: 0,
		},
		maxAttempts: {
			type: Number,
			default: 5,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		consumedAt: {
			type: Date,
			default: null,
		},
		requestedIp: {
			type: String,
			default: null,
		},
		userAgent: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true },
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ identifier: 1, purpose: 1, channel: 1, createdAt: -1 });

export const Otp = model<IOtp>("Otp", OtpSchema);
